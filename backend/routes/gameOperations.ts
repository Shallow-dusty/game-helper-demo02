// backend/routes/gameOperations.ts
/**
 * 游戏离线操作同步端点
 *
 * 这个文件可以集成到任何 Node.js 后端框架（Express, Fastify, Hono 等）
 *
 * 用法:
 * - Express: app.use('/api/game', gameOperationsRouter);
 * - Fastify: app.register(gameOperationsRouter, { prefix: '/api/game' });
 */

import express, { Request, Response } from 'express';

const router = express.Router();
const OPERATION_SYNC_ENABLED = process.env.ENABLE_GAME_OPERATION_SYNC === 'true';

// ============================================================================
// 类型定义（应该从共享类型文件导入）
// ============================================================================

interface Seat {
  id: number;
  userId?: string;
  userName?: string;
  realRoleId?: string;
  isHandRaised?: boolean;
  isDead?: boolean;
  reminders?: Array<{ id: string; icon: string; text: string }>;
}

interface GameState {
  seats: Seat[];
  phase: 'SETUP' | 'NIGHT' | 'DAY' | 'FINISHED';
  voting?: { isOpen: boolean };
  nightActionRequests?: Array<{
    id: string;
    roleId: string;
    resolved: boolean;
    result?: any;
  }>;
  messages?: Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
    recipientId?: string;
  }>;
}

interface OfflineOperation {
  type: 'raise_hand' | 'lower_hand' | 'night_action' | 'send_message' | 'update_reminder';
  seatId?: number;
  content?: string;
  payload?: any;
  reminderId?: string;
  icon?: string;
  text?: string;
  targetSeatId?: number;
  action?: string;
  recipientId?: string;
}

interface OperationResult {
  type: string;
  success: boolean;
  error?: string;
  seatId?: number;
  messageId?: string;
  reminderId?: string;
  actionId?: string;
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从数据库获取游戏状态
 *
 * TODO: 实现实际的数据库查询
 * 根据您的后端框架和数据库选择，替换以下实现：
 * - PostgreSQL: await db.query('SELECT * FROM games WHERE room_id = $1', [roomId]);
 * - MongoDB: await gamesCollection.findOne({ roomId });
 * - Supabase: await supabase.from('games').select('*').eq('room_id', roomId);
 */
async function getGameState(roomId: string): Promise<GameState | null> {
  // 实现示例（使用 Supabase）:
  /*
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (error) return null;
  return data as GameState;
  */

  // 开发用暂存实现
  console.warn(`[getGameState] 未配置真实数据源，拒绝处理房间 ${roomId}`);
  return null; // 用实际数据库调用替换
}

/**
 * 保存游戏状态到数据库
 *
 * TODO: 实现实际的数据库更新
 */
async function updateGameState(roomId: string, gameState: GameState): Promise<boolean> {
  // 实现示例（使用 Supabase）:
  /*
  const { error } = await supabase
    .from('games')
    .update({ game_state: gameState })
    .eq('room_id', roomId);

  return !error;
  */

  console.warn(`[updateGameState] 未配置真实数据源，拒绝更新房间 ${roomId}`);
  return false;
}

/**
 * 验证用户权限
 */
async function verifyUserPermission(
  userId: string,
  roomId: string,
  operationType: string
): Promise<boolean> {
  // TODO: 实现权限验证
  // 检查用户是否在房间中、是否是故事讲述者等

  console.warn(`[verifyUserPermission] 未配置权限校验，拒绝用户 ${userId} 在房间 ${roomId} 执行 ${operationType}`);
  return false;
}

// ============================================================================
// 操作处理函数
// ============================================================================

/**
 * 处理举手操作
 */
function handleRaiseHand(gameState: GameState, userSeat: Seat, op: OfflineOperation): OperationResult {
  // 验证投票阶段
  if (gameState.phase !== 'DAY' || !gameState.voting?.isOpen) {
    return {
      type: 'raise_hand',
      success: false,
      error: 'Voting not open',
    };
  }

  // 验证玩家是否死亡
  if (userSeat.isDead) {
    return {
      type: 'raise_hand',
      success: false,
      error: 'Player is dead',
    };
  }

  // 执行操作
  userSeat.isHandRaised = true;
  return {
    type: 'raise_hand',
    success: true,
    seatId: userSeat.id,
  };
}

/**
 * 处理放下手操作
 */
function handleLowerHand(gameState: GameState, userSeat: Seat, op: OfflineOperation): OperationResult {
  userSeat.isHandRaised = false;
  return {
    type: 'lower_hand',
    success: true,
    seatId: userSeat.id,
  };
}

/**
 * 处理夜间行动
 */
function handleNightAction(gameState: GameState, userSeat: Seat, op: OfflineOperation): OperationResult {
  if (gameState.phase !== 'NIGHT') {
    return {
      type: 'night_action',
      success: false,
      error: 'Not in night phase',
    };
  }

  // 检查玩家是否有待执行的行动
  const actionRequest = gameState.nightActionRequests?.find(
    r => r.roleId === userSeat.realRoleId && !r.resolved
  );

  if (!actionRequest) {
    return {
      type: 'night_action',
      success: false,
      error: 'No pending action',
    };
  }

  // 验证目标
  if (!op.payload?.targetSeatId || !gameState.seats[op.payload.targetSeatId]) {
    return {
      type: 'night_action',
      success: false,
      error: 'Invalid target',
    };
  }

  // 执行行动（这里可以添加更复杂的逻辑）
  actionRequest.resolved = true;
  actionRequest.result = {
    targetSeatId: op.payload.targetSeatId,
    action: op.payload.action,
    timestamp: Date.now(),
  };

  return {
    type: 'night_action',
    success: true,
    actionId: actionRequest.id,
  };
}

/**
 * 处理发送消息
 */
function handleSendMessage(gameState: GameState, userSeat: Seat, op: OfflineOperation): OperationResult {
  // 验证消息内容
  if (!op.content || op.content.trim().length === 0) {
    return {
      type: 'send_message',
      success: false,
      error: 'Empty message',
    };
  }

  // 消息长度限制
  if (op.content.length > 500) {
    return {
      type: 'send_message',
      success: false,
      error: 'Message too long (max 500 characters)',
    };
  }

  // 初始化消息数组
  if (!gameState.messages) {
    gameState.messages = [];
  }

  // 添加消息
  const messageId = generateId();
  gameState.messages.push({
    id: messageId,
    userId: userSeat.userId!,
    userName: userSeat.userName || 'Unknown',
    content: op.content,
    timestamp: Date.now(),
    recipientId: op.recipientId, // 如果是私聊
  });

  return {
    type: 'send_message',
    success: true,
    messageId,
  };
}

/**
 * 处理提醒更新
 */
function handleUpdateReminder(gameState: GameState, userSeat: Seat, op: OfflineOperation): OperationResult {
  // 初始化提醒数组
  if (!userSeat.reminders) {
    userSeat.reminders = [];
  }

  // 创建或更新提醒
  const reminderId = op.reminderId || generateId();
  const reminder = {
    id: reminderId,
    icon: op.icon || '📝',
    text: op.text || '',
  };

  const existingIndex = userSeat.reminders.findIndex(r => r.id === reminderId);
  if (existingIndex >= 0) {
    userSeat.reminders[existingIndex] = reminder;
  } else {
    userSeat.reminders.push(reminder);
  }

  return {
    type: 'update_reminder',
    success: true,
    reminderId,
  };
}

// ============================================================================
// 主路由处理
// ============================================================================

/**
 * POST /api/game/operation
 *
 * 同步离线操作
 *
 * 请求体:
 * {
 *   "userId": "user123",
 *   "roomId": "room456",
 *   "operations": [
 *     { "type": "raise_hand", "seatId": 0 },
 *     { "type": "send_message", "content": "Hello!" }
 *   ]
 * }
 *
 * 响应:
 * {
 *   "success": true,
 *   "processed": 2,
 *   "results": [
 *     { "type": "raise_hand", "success": true, "seatId": 0 },
 *     { "type": "send_message", "success": true, "messageId": "..." }
 *   ]
 * }
 */
router.post('/operation', async (req: Request, res: Response) => {
  try {
    if (!OPERATION_SYNC_ENABLED) {
      return res.status(503).json({
        success: false,
        error: 'Game operation sync is disabled by default. Set ENABLE_GAME_OPERATION_SYNC=true only after implementing database and permission handlers.',
      });
    }

    const { userId, roomId, operations } = req.body;

    // 验证请求参数
    if (!userId || !roomId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or roomId',
      });
    }

    if (!Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        error: 'Operations must be an array',
      });
    }

    // 验证用户权限
    const hasPermission = await verifyUserPermission(userId, roomId, 'sync_operations');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'User not authorized to sync operations in this room',
      });
    }

    // 获取当前游戏状态
    const gameState = await getGameState(roomId);
    if (!gameState) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }

    // 查找用户座位
    const userSeat = gameState.seats.find(s => s.userId === userId);
    if (!userSeat) {
      return res.status(403).json({
        success: false,
        error: 'User not in game',
      });
    }

    // 处理每个操作
    const results: OperationResult[] = [];
    for (const op of operations) {
      try {
        let result: OperationResult;

        switch (op.type) {
          case 'raise_hand':
            result = handleRaiseHand(gameState, userSeat, op);
            break;

          case 'lower_hand':
            result = handleLowerHand(gameState, userSeat, op);
            break;

          case 'night_action':
            result = handleNightAction(gameState, userSeat, op);
            break;

          case 'send_message':
            result = handleSendMessage(gameState, userSeat, op);
            break;

          case 'update_reminder':
            result = handleUpdateReminder(gameState, userSeat, op);
            break;

          default:
            result = {
              type: op.type,
              success: false,
              error: `Unknown operation type: ${op.type}`,
            };
        }

        results.push(result);
      } catch (error) {
        results.push({
          type: op.type,
          success: false,
          error: String(error),
        });
      }
    }

    // 更新游戏状态
    const saved = await updateGameState(roomId, gameState);
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save game state',
      });
    }

    // 返回结果
    return res.json({
      success: true,
      processed: results.length,
      results,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Operation sync error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: String(error),
    });
  }
});

/**
 * GET /api/game/operations/status
 *
 * 获取操作队列状态
 */
router.get('/operations/status', (req: Request, res: Response) => {
  // 这个端点可以返回：
  // - 待处理操作数量
  // - 最后同步时间
  // - 服务器状态

  return res.json({
    status: OPERATION_SYNC_ENABLED ? 'ready' : 'disabled',
    timestamp: Date.now(),
    operationsProcessed: 0, // TODO: 从数据库获取
    operationSyncEnabled: OPERATION_SYNC_ENABLED,
  });
});

// ============================================================================
// 导出
// ============================================================================

export default router;

/*
使用示例（Express）:

import express from 'express';
import gameOperationsRouter from './backend/routes/gameOperations';

const app = express();
app.use(express.json());

// 挂载路由
app.use('/api/game', gameOperationsRouter);

// 启动服务器
app.listen(3000, () => {
  console.log('Game API server running on http://localhost:3000');
});

使用示例（Fastify）:

import fastify from 'fastify';
import gameOperationsRouter from './backend/routes/gameOperations';

const app = fastify();

// 注册路由（需要转换为 Fastify 格式）
app.register(gameOperationsRouter, { prefix: '/api/game' });

app.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
*/
