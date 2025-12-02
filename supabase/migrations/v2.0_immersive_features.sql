-- ============================================================================
-- Grimoire Web v2.0 - Immersive Features Database Migration
-- ============================================================================
-- This migration adds independent tables for interaction logs and daily nominations
-- to support new immersive gameplay features.
-- ============================================================================

-- ============================================================================
-- Chapter 1: Interaction Logs Table
-- ============================================================================
-- Stores all game interactions (night actions, votes, nominations, etc.)
-- for the After-Action Report and game history features.

CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id BIGINT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    game_day INTEGER NOT NULL DEFAULT 1,
    phase TEXT NOT NULL CHECK (phase IN ('DAY', 'NIGHT', 'DUSK', 'DAWN')),
    
    -- Actor information
    actor_seat INTEGER,
    actor_role TEXT,
    actor_team TEXT CHECK (actor_team IN ('GOOD', 'EVIL', 'NEUTRAL')),
    
    -- Target information (for actions that have targets)
    target_seat INTEGER,
    target_role TEXT,
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'NIGHT_ACTION',      -- Night ability usage
        'NOMINATION',        -- Nominated someone
        'VOTE',              -- Voted for execution
        'EXECUTION',         -- Was executed
        'DEATH',             -- Died (any cause)
        'REVIVAL',           -- Was revived
        'ROLE_CHANGE',       -- Role changed
        'ALIGNMENT_CHANGE',  -- Alignment changed
        'INFO_RECEIVED',     -- Received information
        'POISON',            -- Was poisoned
        'PROTECTION',        -- Was protected
        'CHAIN_REACTION'     -- Part of a chain reaction
    )),
    
    -- Action payload (flexible JSON for action-specific data)
    payload JSONB DEFAULT '{}'::jsonb,
    
    -- Result of the action
    result TEXT CHECK (result IN ('SUCCESS', 'BLOCKED', 'REDIRECTED', 'FAILED', 'PENDING')),
    result_details TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT valid_seats CHECK (
        (actor_seat IS NULL OR (actor_seat >= 0 AND actor_seat < 20)) AND
        (target_seat IS NULL OR (target_seat >= 0 AND target_seat < 20))
    )
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_interaction_logs_room ON interaction_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_room_day ON interaction_logs(room_id, game_day);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_action_type ON interaction_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_actor ON interaction_logs(room_id, actor_seat);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_target ON interaction_logs(room_id, target_seat);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created ON interaction_logs(created_at DESC);

-- ============================================================================
-- Chapter 2: Daily Nominations Table
-- ============================================================================
-- Tracks nominations per day to enforce the "one nomination per player per day" rule.

CREATE TABLE IF NOT EXISTS daily_nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id BIGINT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    game_day INTEGER NOT NULL,
    nominator_seat INTEGER NOT NULL CHECK (nominator_seat >= 0 AND nominator_seat < 20),
    nominee_seat INTEGER NOT NULL CHECK (nominee_seat >= 0 AND nominee_seat < 20),
    
    -- Nomination metadata
    was_seconded BOOLEAN DEFAULT FALSE,
    vote_count INTEGER DEFAULT 0,
    was_executed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one nomination per player per day (but allow being nominated multiple times)
    CONSTRAINT unique_nominator_per_day UNIQUE (room_id, game_day, nominator_seat)
);

-- Indexes for nomination queries
CREATE INDEX IF NOT EXISTS idx_daily_nominations_room ON daily_nominations(room_id);
CREATE INDEX IF NOT EXISTS idx_daily_nominations_room_day ON daily_nominations(room_id, game_day);
CREATE INDEX IF NOT EXISTS idx_daily_nominations_nominee ON daily_nominations(room_id, nominee_seat);

-- ============================================================================
-- Chapter 3: RPC Functions
-- ============================================================================

-- Function to log an interaction
CREATE OR REPLACE FUNCTION log_interaction(
    p_room_id BIGINT,
    p_game_day INTEGER,
    p_phase TEXT,
    p_actor_seat INTEGER DEFAULT NULL,
    p_actor_role TEXT DEFAULT NULL,
    p_actor_team TEXT DEFAULT NULL,
    p_target_seat INTEGER DEFAULT NULL,
    p_target_role TEXT DEFAULT NULL,
    p_action_type TEXT DEFAULT 'NIGHT_ACTION',
    p_payload JSONB DEFAULT '{}'::jsonb,
    p_result TEXT DEFAULT 'SUCCESS',
    p_result_details TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO interaction_logs (
        room_id, game_day, phase,
        actor_seat, actor_role, actor_team,
        target_seat, target_role,
        action_type, payload, result, result_details
    ) VALUES (
        p_room_id, p_game_day, p_phase,
        p_actor_seat, p_actor_role, p_actor_team,
        p_target_seat, p_target_role,
        p_action_type, p_payload, p_result, p_result_details
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Function to check if a player can nominate today
CREATE OR REPLACE FUNCTION check_nomination_eligibility(
    p_room_id BIGINT,
    p_game_day INTEGER,
    p_nominator_seat INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_nomination RECORD;
    v_result JSONB;
BEGIN
    -- Check if player has already nominated today
    SELECT * INTO v_existing_nomination
    FROM daily_nominations
    WHERE room_id = p_room_id
      AND game_day = p_game_day
      AND nominator_seat = p_nominator_seat;
    
    IF v_existing_nomination IS NOT NULL THEN
        v_result := jsonb_build_object(
            'canNominate', false,
            'reason', 'ALREADY_NOMINATED',
            'previousNominee', v_existing_nomination.nominee_seat
        );
    ELSE
        v_result := jsonb_build_object(
            'canNominate', true,
            'reason', NULL,
            'previousNominee', NULL
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Function to record a nomination
CREATE OR REPLACE FUNCTION record_nomination(
    p_room_id BIGINT,
    p_game_day INTEGER,
    p_nominator_seat INTEGER,
    p_nominee_seat INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nomination_id UUID;
    v_eligibility JSONB;
BEGIN
    -- First check eligibility
    v_eligibility := check_nomination_eligibility(p_room_id, p_game_day, p_nominator_seat);
    
    IF NOT (v_eligibility->>'canNominate')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_eligibility->>'reason',
            'nominationId', NULL
        );
    END IF;
    
    -- Record the nomination
    INSERT INTO daily_nominations (
        room_id, game_day, nominator_seat, nominee_seat
    ) VALUES (
        p_room_id, p_game_day, p_nominator_seat, p_nominee_seat
    )
    RETURNING id INTO v_nomination_id;
    
    -- Also log this as an interaction
    PERFORM log_interaction(
        p_room_id := p_room_id,
        p_game_day := p_game_day,
        p_phase := 'DAY',
        p_actor_seat := p_nominator_seat,
        p_target_seat := p_nominee_seat,
        p_action_type := 'NOMINATION',
        p_result := 'SUCCESS'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'error', NULL,
        'nominationId', v_nomination_id
    );
END;
$$;

-- Function to update nomination result (after voting)
CREATE OR REPLACE FUNCTION update_nomination_result(
    p_room_id BIGINT,
    p_game_day INTEGER,
    p_nominee_seat INTEGER,
    p_was_seconded BOOLEAN,
    p_vote_count INTEGER,
    p_was_executed BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE daily_nominations
    SET 
        was_seconded = p_was_seconded,
        vote_count = p_vote_count,
        was_executed = p_was_executed
    WHERE room_id = p_room_id
      AND game_day = p_game_day
      AND nominee_seat = p_nominee_seat;
    
    RETURN FOUND;
END;
$$;

-- Function to get game interactions for After-Action Report
CREATE OR REPLACE FUNCTION get_game_interactions(
    p_room_id BIGINT,
    p_game_day INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'gameDay', game_day,
            'phase', phase,
            'actorSeat', actor_seat,
            'actorRole', actor_role,
            'actorTeam', actor_team,
            'targetSeat', target_seat,
            'targetRole', target_role,
            'actionType', action_type,
            'payload', payload,
            'result', result,
            'resultDetails', result_details,
            'createdAt', created_at
        ) ORDER BY game_day, 
            CASE phase 
                WHEN 'DAWN' THEN 1 
                WHEN 'DAY' THEN 2 
                WHEN 'DUSK' THEN 3 
                WHEN 'NIGHT' THEN 4 
            END,
            created_at
    )
    INTO v_result
    FROM interaction_logs
    WHERE room_id = p_room_id
      AND (p_game_day IS NULL OR game_day = p_game_day);
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Function to get nomination history for a game
CREATE OR REPLACE FUNCTION get_nomination_history(
    p_room_id BIGINT,
    p_game_day INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'gameDay', game_day,
            'nominatorSeat', nominator_seat,
            'nomineeSeat', nominee_seat,
            'wasSeconded', was_seconded,
            'voteCount', vote_count,
            'wasExecuted', was_executed,
            'createdAt', created_at
        ) ORDER BY game_day, created_at
    )
    INTO v_result
    FROM daily_nominations
    WHERE room_id = p_room_id
      AND (p_game_day IS NULL OR game_day = p_game_day);
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============================================================================
-- Chapter 4: Row Level Security
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nominations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view logs for rooms they are in" ON interaction_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON interaction_logs;
DROP POLICY IF EXISTS "Service role can update logs" ON interaction_logs;
DROP POLICY IF EXISTS "Users can view nominations for rooms they are in" ON daily_nominations;
DROP POLICY IF EXISTS "Service role can insert nominations" ON daily_nominations;
DROP POLICY IF EXISTS "Service role can update nominations" ON daily_nominations;

-- Interaction logs policies
CREATE POLICY "Users can view logs for rooms they are in"
    ON interaction_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM game_rooms
            WHERE game_rooms.id = interaction_logs.room_id
            AND (
                game_rooms.data->>'hostId' = auth.uid()::text
                OR game_rooms.data->'players' ? auth.uid()::text
            )
        )
    );

CREATE POLICY "Service role can insert logs"
    ON interaction_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update logs"
    ON interaction_logs FOR UPDATE
    USING (true);

-- Daily nominations policies
CREATE POLICY "Users can view nominations for rooms they are in"
    ON daily_nominations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM game_rooms
            WHERE game_rooms.id = daily_nominations.room_id
            AND (
                game_rooms.data->>'hostId' = auth.uid()::text
                OR game_rooms.data->'players' ? auth.uid()::text
            )
        )
    );

CREATE POLICY "Service role can insert nominations"
    ON daily_nominations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update nominations"
    ON daily_nominations FOR UPDATE
    USING (true);

-- ============================================================================
-- Chapter 5: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE interaction_logs IS 'Stores all game interactions for After-Action Report and history features';
COMMENT ON TABLE daily_nominations IS 'Tracks nominations per day to enforce one-nomination-per-player rule';

COMMENT ON FUNCTION log_interaction IS 'Records a game interaction to the interaction_logs table';
COMMENT ON FUNCTION check_nomination_eligibility IS 'Checks if a player can nominate on the current day';
COMMENT ON FUNCTION record_nomination IS 'Records a new nomination and logs it as an interaction';
COMMENT ON FUNCTION update_nomination_result IS 'Updates nomination with voting results';
COMMENT ON FUNCTION get_game_interactions IS 'Retrieves all interactions for a game, optionally filtered by day';
COMMENT ON FUNCTION get_nomination_history IS 'Retrieves nomination history for a game';

-- ============================================================================
-- Migration Complete
-- ============================================================================
