-- Create a new table for storing secret game state
CREATE TABLE IF NOT EXISTS game_secrets (
  room_code TEXT PRIMARY KEY REFERENCES game_rooms(room_code) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE game_secrets ENABLE ROW LEVEL SECURITY;

-- Policy: Only the creator (Storyteller) can insert/update/select their own secrets
-- We assume the 'game_rooms' table has a 'created_by' field or similar, 
-- BUT since game_rooms stores the full state in 'data', we might need to rely on the user ID matching.
-- However, standard Supabase pattern is to link to auth.users.
-- In this demo, we might not have a strict 'owner' column in game_rooms.
-- Let's check if game_rooms has an owner column. If not, we might need to add one or rely on client-side ID (less secure but fits the demo).

-- Actually, looking at createConnectionSlice, we don't seem to be using Supabase Auth (user.id is random string).
-- This means we can't use RLS based on auth.uid().
-- This is a limitation of the current "Anonymous/No-Auth" architecture.
-- To secure this properly without true Auth, we'd need a "Storyteller Token" or similar.
-- FOR NOW: We will rely on the fact that only the Storyteller *client* knows to subscribe to this table.
-- BUT to prevent players from subscribing, we ideally need a check.
-- Since we don't have real auth, we can't enforce "Only Storyteller" via RLS easily without changing the auth model.
-- COMPROMISE for this Demo:
-- We will create the table. We will allow public read/write for now (since we lack Auth), 
-- BUT the *application logic* will only subscribe to it if the user is the Storyteller.
-- This prevents *passive* sniffing (listening to game_rooms channel).
-- An attacker would need to actively query 'game_secrets' knowing the room_code.
-- To make it slightly harder, we could require a 'secret_token' in the row, but that's complex.

-- Let's stick to the plan: Split the data. Even if RLS is open, separating the data means
-- a standard client listening to 'game_rooms' won't see the secrets.
-- This defeats the "inspect network traffic" attack for normal users.

CREATE POLICY "Enable all access for now (Demo Mode)" ON game_secrets FOR ALL USING (true) WITH CHECK (true);

-- If we had real auth, it would be:
-- CREATE POLICY "Storyteller only" ON game_secrets FOR ALL USING (auth.uid() = owner_id);
