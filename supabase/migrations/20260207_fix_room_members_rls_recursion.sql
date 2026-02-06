-- Fix RLS recursion between game_rooms_select and room_members_select.
--
-- Strategy:
-- 1) Use SECURITY DEFINER helper to check storyteller ownership without
--    triggering RLS recursion through game_rooms policies.
-- 2) Recreate room_members policies to use the helper for storyteller checks.

CREATE OR REPLACE FUNCTION public.is_storyteller_of_room(p_room_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_rooms gr
    WHERE gr.id = p_room_id
      AND gr.storyteller_id = (select auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_storyteller_of_room(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_storyteller_of_room(bigint) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "room_members_select" ON room_members;
DROP POLICY IF EXISTS "room_members_insert" ON room_members;
DROP POLICY IF EXISTS "room_members_update" ON room_members;
DROP POLICY IF EXISTS "room_members_delete" ON room_members;

CREATE POLICY "room_members_select"
  ON room_members FOR SELECT
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    public.is_storyteller_of_room(room_members.room_id)
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
          public.is_storyteller_of_room(room_members.room_id)
        )
      )
    )
  );

CREATE POLICY "room_members_update"
  ON room_members FOR UPDATE
  USING (
    (select auth.role()) = 'service_role' OR
    (select auth.uid()) = user_id OR
    public.is_storyteller_of_room(room_members.room_id)
  )
  WITH CHECK (
    (select auth.role()) = 'service_role' OR
    public.is_storyteller_of_room(room_members.room_id) OR
    (
      (select auth.uid()) = user_id AND
      role IN ('player', 'observer') AND
      EXISTS (
        SELECT 1
        FROM room_members rm
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
    public.is_storyteller_of_room(room_members.room_id)
  );
