-- Optimize RLS policy performance and remove duplicated permissive policies.
--
-- Goals:
-- 1) Replace direct auth.uid()/auth.role() calls with (select auth.*())
--    so Postgres can evaluate once per statement (initplan) instead of per-row.
-- 2) Remove legacy duplicate permissive policies that overlap with canonical rules.
-- 3) Keep authorization semantics aligned with current secure model.

-- ============================================================
-- Drop canonical + legacy duplicate policies
-- ============================================================

-- game_rooms
DROP POLICY IF EXISTS "game_rooms_select" ON game_rooms;
DROP POLICY IF EXISTS "game_rooms_insert" ON game_rooms;
DROP POLICY IF EXISTS "game_rooms_update" ON game_rooms;
DROP POLICY IF EXISTS "game_rooms_select_public" ON game_rooms;
DROP POLICY IF EXISTS "game_rooms_insert_storyteller" ON game_rooms;
DROP POLICY IF EXISTS "game_rooms_update_storyteller" ON game_rooms;
DROP POLICY IF EXISTS "game_rooms_delete_storyteller" ON game_rooms;

-- room_members
DROP POLICY IF EXISTS "room_members_select" ON room_members;
DROP POLICY IF EXISTS "room_members_insert" ON room_members;
DROP POLICY IF EXISTS "room_members_update" ON room_members;
DROP POLICY IF EXISTS "room_members_delete" ON room_members;
DROP POLICY IF EXISTS "room_members_select_self_or_storyteller" ON room_members;
DROP POLICY IF EXISTS "room_members_insert_self" ON room_members;
DROP POLICY IF EXISTS "room_members_update_storyteller" ON room_members;
DROP POLICY IF EXISTS "room_members_delete_self_or_storyteller" ON room_members;

-- game_secrets
DROP POLICY IF EXISTS "game_secrets_select" ON game_secrets;
DROP POLICY IF EXISTS "game_secrets_insert" ON game_secrets;
DROP POLICY IF EXISTS "game_secrets_update" ON game_secrets;
DROP POLICY IF EXISTS "game_secrets_delete" ON game_secrets;
DROP POLICY IF EXISTS "game_secrets_select_storyteller" ON game_secrets;
DROP POLICY IF EXISTS "game_secrets_insert_storyteller" ON game_secrets;
DROP POLICY IF EXISTS "game_secrets_update_storyteller" ON game_secrets;
DROP POLICY IF EXISTS "game_secrets_delete_storyteller" ON game_secrets;

-- seat_secrets
DROP POLICY IF EXISTS "seat_secrets_select_st_only" ON seat_secrets;
DROP POLICY IF EXISTS "seat_secrets_insert_st_only" ON seat_secrets;
DROP POLICY IF EXISTS "seat_secrets_update_st_only" ON seat_secrets;
DROP POLICY IF EXISTS "seat_secrets_delete_st_only" ON seat_secrets;
DROP POLICY IF EXISTS "seat_secrets_select_storyteller" ON seat_secrets;
DROP POLICY IF EXISTS "seat_secrets_insert_storyteller" ON seat_secrets;
DROP POLICY IF EXISTS "seat_secrets_update_storyteller" ON seat_secrets;
DROP POLICY IF EXISTS "seat_secrets_delete_storyteller" ON seat_secrets;

-- game_messages
DROP POLICY IF EXISTS "game_messages_select" ON game_messages;
DROP POLICY IF EXISTS "game_messages_insert" ON game_messages;
DROP POLICY IF EXISTS "game_messages_select_members" ON game_messages;
DROP POLICY IF EXISTS "game_messages_insert_members" ON game_messages;

-- interaction_logs
DROP POLICY IF EXISTS "interaction_logs_select" ON interaction_logs;
DROP POLICY IF EXISTS "interaction_logs_insert" ON interaction_logs;
DROP POLICY IF EXISTS "interaction_logs_update" ON interaction_logs;
DROP POLICY IF EXISTS "interaction_logs_select_members" ON interaction_logs;
DROP POLICY IF EXISTS "interaction_logs_insert_storyteller" ON interaction_logs;
DROP POLICY IF EXISTS "interaction_logs_update_storyteller" ON interaction_logs;

-- daily_nominations
DROP POLICY IF EXISTS "daily_nominations_select" ON daily_nominations;
DROP POLICY IF EXISTS "daily_nominations_insert" ON daily_nominations;
DROP POLICY IF EXISTS "daily_nominations_update" ON daily_nominations;
DROP POLICY IF EXISTS "daily_nominations_select_members" ON daily_nominations;
DROP POLICY IF EXISTS "daily_nominations_insert_storyteller" ON daily_nominations;
DROP POLICY IF EXISTS "daily_nominations_update_storyteller" ON daily_nominations;

-- game_history
DROP POLICY IF EXISTS "game_history_select" ON game_history;
DROP POLICY IF EXISTS "game_history_insert" ON game_history;
DROP POLICY IF EXISTS "game_history_select_members" ON game_history;
DROP POLICY IF EXISTS "game_history_insert_storyteller" ON game_history;

-- ============================================================
-- Recreate canonical policies with initplan-friendly auth calls
-- ============================================================

-- game_rooms
CREATE POLICY "game_rooms_select"
  ON game_rooms FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = storyteller_id OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = game_rooms.id
        AND rm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "game_rooms_insert"
  ON game_rooms FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = storyteller_id
  );

CREATE POLICY "game_rooms_update"
  ON game_rooms FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = storyteller_id
  );

CREATE POLICY "game_rooms_delete_storyteller"
  ON game_rooms FOR DELETE
  USING (
    (select auth.uid()) = storyteller_id
  );

-- room_members
CREATE POLICY "room_members_select"
  ON room_members FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = room_members.room_id
        AND gr.storyteller_id = (select auth.uid())
    )
  );

CREATE POLICY "room_members_insert"
  ON room_members FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    (
      (select auth.uid()) = user_id AND (
        (
          role IN ('player', 'observer') AND
          seat_id IS NULL AND
          seen_role_id IS NULL
        ) OR (
          role = 'storyteller' AND
          EXISTS (
            SELECT 1 FROM game_rooms gr
            WHERE gr.id = room_members.room_id
              AND gr.storyteller_id = (select auth.uid())
          )
        )
      )
    )
  );

CREATE POLICY "room_members_update"
  ON room_members FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = room_members.room_id
        AND gr.storyteller_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = room_members.room_id
        AND gr.storyteller_id = (select auth.uid())
    ) OR
    (
      (select auth.uid()) = user_id AND
      role IN ('player', 'observer') AND
      EXISTS (
        SELECT 1 FROM room_members rm
        WHERE rm.id = room_members.id
          AND rm.role IS NOT DISTINCT FROM room_members.role
          AND rm.seat_id IS NOT DISTINCT FROM room_members.seat_id
          AND rm.seen_role_id IS NOT DISTINCT FROM room_members.seen_role_id
      )
    )
  );

CREATE POLICY "room_members_delete"
  ON room_members FOR DELETE
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = room_members.room_id
        AND gr.storyteller_id = (select auth.uid())
    )
  );

-- game_secrets
CREATE POLICY "game_secrets_select"
  ON game_secrets FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.room_code = game_secrets.room_code
        AND gr.storyteller_id = (select auth.uid())
    )
  );

CREATE POLICY "game_secrets_insert"
  ON game_secrets FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.room_code = game_secrets.room_code
        AND gr.storyteller_id = (select auth.uid())
    )
  );

CREATE POLICY "game_secrets_update"
  ON game_secrets FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.room_code = game_secrets.room_code
        AND gr.storyteller_id = (select auth.uid())
    )
  );

CREATE POLICY "game_secrets_delete"
  ON game_secrets FOR DELETE
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.room_code = game_secrets.room_code
        AND gr.storyteller_id = (select auth.uid())
    )
  );

-- seat_secrets (storyteller only)
CREATE POLICY "seat_secrets_select_st_only"
  ON seat_secrets FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = seat_secrets.room_id
        AND gr.storyteller_id = (select auth.uid())
    )
  );

CREATE POLICY "seat_secrets_insert_st_only"
  ON seat_secrets FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = seat_secrets.room_id
        AND gr.storyteller_id = (select auth.uid())
    )
  );

CREATE POLICY "seat_secrets_update_st_only"
  ON seat_secrets FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = seat_secrets.room_id
        AND gr.storyteller_id = (select auth.uid())
    )
  );

CREATE POLICY "seat_secrets_delete_st_only"
  ON seat_secrets FOR DELETE
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = seat_secrets.room_id
        AND gr.storyteller_id = (select auth.uid())
    )
  );

-- game_messages (members only)
CREATE POLICY "game_messages_select"
  ON game_messages FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.id = game_messages.room_id
        AND gr.storyteller_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = game_messages.room_id
        AND rm.user_id = (select auth.uid())
        AND (
          game_messages.recipient_seat_id IS NULL OR
          rm.seat_id = game_messages.sender_seat_id OR
          rm.seat_id = game_messages.recipient_seat_id
        )
    )
  );

CREATE POLICY "game_messages_insert"
  ON game_messages FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = game_messages.room_id
        AND rm.user_id = (select auth.uid())
    )
  );

-- interaction_logs (storyteller only)
CREATE POLICY "interaction_logs_select"
  ON interaction_logs FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = interaction_logs.room_id
        AND rm.user_id = (select auth.uid())
        AND rm.role = 'storyteller'
    )
  );

CREATE POLICY "interaction_logs_insert"
  ON interaction_logs FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = interaction_logs.room_id
        AND rm.user_id = (select auth.uid())
        AND rm.role = 'storyteller'
    )
  );

CREATE POLICY "interaction_logs_update"
  ON interaction_logs FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = interaction_logs.room_id
        AND rm.user_id = (select auth.uid())
        AND rm.role = 'storyteller'
    )
  );

-- daily_nominations (storyteller only)
CREATE POLICY "daily_nominations_select"
  ON daily_nominations FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = daily_nominations.room_id
        AND rm.user_id = (select auth.uid())
        AND rm.role = 'storyteller'
    )
  );

CREATE POLICY "daily_nominations_insert"
  ON daily_nominations FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = daily_nominations.room_id
        AND rm.user_id = (select auth.uid())
        AND rm.role = 'storyteller'
    )
  );

CREATE POLICY "daily_nominations_update"
  ON daily_nominations FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = daily_nominations.room_id
        AND rm.user_id = (select auth.uid())
        AND rm.role = 'storyteller'
    )
  );

-- game_history
CREATE POLICY "game_history_select"
  ON game_history FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.room_code = game_history.room_code
        AND gr.storyteller_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM room_members rm
      JOIN game_rooms gr ON gr.id = rm.room_id
      WHERE gr.room_code = game_history.room_code
        AND rm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "game_history_insert"
  ON game_history FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM game_rooms gr
      WHERE gr.room_code = game_history.room_code
        AND gr.storyteller_id = (select auth.uid())
    )
  );
