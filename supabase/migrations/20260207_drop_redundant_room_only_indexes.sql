-- Drop redundant single-column room_id indexes that are covered by
-- existing composite indexes with the same leading column.
--
-- Covered by:
-- - interaction_logs(room_id, game_day)
-- - daily_nominations(room_id, game_day)

DROP INDEX IF EXISTS public.idx_interaction_logs_room;
DROP INDEX IF EXISTS public.idx_daily_nominations_room;
