-- ============================================================
-- Grimoire Web v0.7.3 增量更新 SQL
-- 修复座位系统数据结构不匹配问题
-- 执行时间: 2025-11-27
-- ============================================================

-- 删除旧版本的函数（如果存在）
DROP FUNCTION IF EXISTS claim_seat(text, int, text, text);

-- ============================================================
-- 新版 claim_seat 函数
-- 修复: 使用 userId + userName 替代 player 字段
-- 新增: p_user_id 参数
-- 新增: 重复座位检测
-- ============================================================

CREATE OR REPLACE FUNCTION claim_seat(
  p_room_code text,
  p_seat_id int,
  p_user_id text,
  p_player_name text,
  p_client_token text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_data jsonb;
  v_seats jsonb;
  v_target_seat jsonb;
  v_existing_seat jsonb;
  v_seat_index int;
BEGIN
  -- Lock the room row for update
  SELECT data INTO v_room_data
  FROM game_rooms
  WHERE room_code = p_room_code
  FOR UPDATE;
  
  IF v_room_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;
  
  v_seats := v_room_data->'seats';
  
  IF v_seats IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No seats in room');
  END IF;
  
  -- Check if user already has a seat in this room
  FOR v_seat_index IN 0..jsonb_array_length(v_seats)-1 LOOP
    v_existing_seat := v_seats->v_seat_index;
    IF v_existing_seat->>'userId' = p_user_id AND v_seat_index != p_seat_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'You already have seat ' || (v_seat_index + 1));
    END IF;
  END LOOP;
  
  -- Check if seat is already taken
  v_target_seat := v_seats->p_seat_id;
  
  IF v_target_seat IS NOT NULL 
     AND v_target_seat->>'userId' IS NOT NULL 
     AND v_target_seat->>'userId' != '' 
     AND v_target_seat->>'userId' != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat already taken', 'currentPlayer', v_target_seat->>'userName');
  END IF;
  
  -- Preserve existing seat data and update player info
  v_seats := jsonb_set(
    v_seats,
    ARRAY[p_seat_id::text],
    (COALESCE(v_target_seat, '{}'::jsonb) || jsonb_build_object(
      'id', p_seat_id,
      'userId', p_user_id,
      'userName', p_player_name,
      'isVirtual', false,
      'clientToken', p_client_token
    ))
  );
  
  -- Save updated data
  UPDATE game_rooms
  SET 
    data = jsonb_set(v_room_data, '{seats}', v_seats),
    updated_at = now()
  WHERE room_code = p_room_code;
  
  RETURN jsonb_build_object('success', true, 'seat', v_seats->p_seat_id);
END;
$$;

-- ============================================================
-- 更新 leave_seat 函数
-- 修复: 正确清空 userId/userName 字段
-- ============================================================

CREATE OR REPLACE FUNCTION leave_seat(
  p_room_code text,
  p_seat_id int,
  p_client_token text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_data jsonb;
  v_seats jsonb;
  v_target_seat jsonb;
BEGIN
  -- Lock the room row for update
  SELECT data INTO v_room_data
  FROM game_rooms
  WHERE room_code = p_room_code
  FOR UPDATE;
  
  IF v_room_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;
  
  v_seats := v_room_data->'seats';
  v_target_seat := v_seats->p_seat_id;
  
  -- Verify client token matches (only owner can leave)
  IF v_target_seat->>'clientToken' != p_client_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your seat');
  END IF;
  
  -- Clear the seat (preserve structure, clear user info)
  v_seats := jsonb_set(
    v_seats,
    ARRAY[p_seat_id::text],
    (v_target_seat - 'clientToken') || jsonb_build_object(
      'id', p_seat_id,
      'userId', null,
      'userName', '',
      'isVirtual', false
    )
  );
  
  -- Save updated data
  UPDATE game_rooms
  SET 
    data = jsonb_set(v_room_data, '{seats}', v_seats),
    updated_at = now()
  WHERE room_code = p_room_code;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 验证函数已创建
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'v0.7.3 SQL patch applied successfully!';
  RAISE NOTICE 'claim_seat: now accepts p_user_id parameter';
  RAISE NOTICE 'leave_seat: updated for userId/userName fields';
END;
$$;
