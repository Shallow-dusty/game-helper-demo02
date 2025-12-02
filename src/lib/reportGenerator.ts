import { GameState, VoteRecord, ChatMessage, Seat } from '../types';
import { ROLES } from '../constants/roles';

/**
 * 复盘战报生成模块
 * 
 * 基于游戏日志生成结构化的战报数据，用于复盘和分享
 */

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'phase_change' | 'death' | 'vote' | 'execution' | 'ability' | 'info' | 'game_end';
  title: string;
  description: string;
  involvedSeats: number[];
  metadata?: Record<string, unknown>;
}

export interface PlayerSummary {
  seatId: number;
  name: string;
  realRole: string | null;
  seenRole: string | null;
  team: string | null;
  wasMisled: boolean;
  wasTainted: boolean;
  survivalRounds: number;
  votesCast: number;
  votesReceived: number;
  isDead: boolean;
  deathRound?: number;
  mvpScore: number;
}

export interface AfterActionReport {
  gameId: string;
  scriptName: string;
  winner: 'GOOD' | 'EVIL' | null;
  winReason: string;
  totalRounds: number;
  duration: number; // in minutes (estimated)
  playerSummaries: PlayerSummary[];
  timeline: TimelineEvent[];
  statistics: {
    totalDeaths: number;
    totalVotes: number;
    totalExecutions: number;
    goodSurvivors: number;
    evilSurvivors: number;
  };
  mvp: PlayerSummary | null;
}

/**
 * 从投票历史提取时间线事件
 */
function extractVoteEvents(voteHistory: VoteRecord[], seats: Seat[]): TimelineEvent[] {
  return voteHistory.map((vote, index) => {
    const nominee = seats[vote.nomineeSeatId];
    const nominator = seats[vote.nominatorSeatId];
    
    return {
      id: `vote-${index}`,
      timestamp: vote.timestamp,
      type: 'vote' as const,
      title: `第 ${vote.round} 轮投票`,
      description: `${nominator?.userName || '未知'} 提名 ${nominee?.userName || '未知'}，获得 ${vote.voteCount} 票，${vote.result === 'executed' ? '处决' : vote.result === 'survived' ? '存活' : '取消'}`,
      involvedSeats: [vote.nominatorSeatId, vote.nomineeSeatId, ...vote.votes],
      metadata: {
        result: vote.result,
        voteCount: vote.voteCount
      }
    };
  });
}

/**
 * 从聊天消息提取关键事件
 */
function extractSystemEvents(messages: ChatMessage[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  messages.forEach((msg, index) => {
    if (msg.type === 'system') {
      // 阶段变更
      if (msg.content.includes('游戏阶段变更')) {
        events.push({
          id: `system-${index}`,
          timestamp: msg.timestamp,
          type: 'phase_change',
          title: '阶段变更',
          description: msg.content,
          involvedSeats: []
        });
      }
      
      // 死亡事件
      if (msg.content.includes('死亡') || msg.content.includes('处决')) {
        events.push({
          id: `death-${index}`,
          timestamp: msg.timestamp,
          type: 'death',
          title: '玩家死亡',
          description: msg.content,
          involvedSeats: []
        });
      }
      
      // 游戏结束
      if (msg.content.includes('胜利') || msg.content.includes('游戏结束')) {
        events.push({
          id: `end-${index}`,
          timestamp: msg.timestamp,
          type: 'game_end',
          title: '游戏结束',
          description: msg.content,
          involvedSeats: []
        });
      }
    }
  });
  
  return events;
}

/**
 * 计算玩家摘要数据
 */
function calculatePlayerSummaries(gameState: GameState): PlayerSummary[] {
  const voteHistory = gameState.voteHistory || [];
  
  return gameState.seats.map(seat => {
    const realRoleId = seat.realRoleId;
    const seenRoleId = seat.seenRoleId;
    const realRole = realRoleId ? ROLES[realRoleId] : null;
    
    // 计算投票数据
    const votesCast = voteHistory.filter(v => v.votes.includes(seat.id)).length;
    const votesReceived = voteHistory.filter(v => v.nomineeSeatId === seat.id).reduce((sum, v) => sum + v.voteCount, 0);
    
    // 计算存活回合数（简化估算）
    const survivalRounds = seat.isDead 
      ? Math.floor(voteHistory.filter(v => v.nomineeSeatId === seat.id && v.result === 'executed').length ? 
          voteHistory.findIndex(v => v.nomineeSeatId === seat.id && v.result === 'executed') + 1 : 
          gameState.roundInfo.totalRounds)
      : gameState.roundInfo.totalRounds;
    
    // MVP 分数计算
    let mvpScore = 0;
    mvpScore += survivalRounds * 10; // 存活加分
    mvpScore += votesCast * 2; // 投票参与加分
    if (!seat.isDead) mvpScore += 50; // 存活到最后加分
    const winner = gameState.gameOver.winner;
    if (realRole?.team && winner) {
      // 判断玩家是否属于获胜方
      const isGoodTeam = realRole.team === 'TOWNSFOLK' || realRole.team === 'OUTSIDER';
      const isEvilTeam = realRole.team === 'DEMON' || realRole.team === 'MINION';
      if ((winner === 'GOOD' && isGoodTeam) || (winner === 'EVIL' && isEvilTeam)) {
        mvpScore += 30; // 胜利方加分
      }
    }
    
    return {
      seatId: seat.id,
      name: seat.userName,
      realRole: realRole?.name || null,
      seenRole: seenRoleId ? ROLES[seenRoleId]?.name || null : null,
      team: realRole?.team || null,
      wasMisled: realRoleId !== seenRoleId && !!realRoleId && !!seenRoleId,
      wasTainted: seat.statuses.includes('POISONED') || seat.statuses.includes('DRUNK'),
      survivalRounds,
      votesCast,
      votesReceived,
      isDead: seat.isDead,
      mvpScore
    };
  });
}

/**
 * 生成完整的战报
 */
export function generateAfterActionReport(gameState: GameState): AfterActionReport {
  const playerSummaries = calculatePlayerSummaries(gameState);
  
  // 合并时间线事件
  const voteEvents = extractVoteEvents(gameState.voteHistory || [], gameState.seats);
  const systemEvents = extractSystemEvents(gameState.messages);
  const timeline = [...voteEvents, ...systemEvents].sort((a, b) => a.timestamp - b.timestamp);
  
  // 统计数据
  const statistics = {
    totalDeaths: gameState.seats.filter(s => s.isDead).length,
    totalVotes: gameState.voteHistory?.length || 0,
    totalExecutions: gameState.voteHistory?.filter(v => v.result === 'executed').length || 0,
    goodSurvivors: gameState.seats.filter(s => {
      const role = s.realRoleId ? ROLES[s.realRoleId] : null;
      return !s.isDead && (role?.team === 'TOWNSFOLK' || role?.team === 'OUTSIDER');
    }).length,
    evilSurvivors: gameState.seats.filter(s => {
      const role = s.realRoleId ? ROLES[s.realRoleId] : null;
      return !s.isDead && (role?.team === 'DEMON' || role?.team === 'MINION');
    }).length,
  };
  
  // 估算游戏时长（每轮约 5 分钟）
  const duration = gameState.roundInfo.totalRounds * 5;
  
  // 找出 MVP
  const mvp = playerSummaries.reduce((prev, current) => 
    (prev.mvpScore > current.mvpScore) ? prev : current
  );
  
  return {
    gameId: gameState.roomId,
    scriptName: gameState.currentScriptId,
    winner: gameState.gameOver.winner,
    winReason: gameState.gameOver.reason,
    totalRounds: gameState.roundInfo.totalRounds,
    duration,
    playerSummaries,
    timeline,
    statistics,
    mvp: mvp.mvpScore > 0 ? mvp : null
  };
}

/**
 * 将战报格式化为可分享的文本
 */
export function formatReportAsText(report: AfterActionReport): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════');
  lines.push('📜 血染钟楼 - 游戏战报');
  lines.push('═══════════════════════════════════════');
  lines.push('');
  lines.push(`🎭 剧本: ${report.scriptName}`);
  lines.push(`⏱️ 时长: 约 ${report.duration} 分钟 (${report.totalRounds} 轮)`);
  lines.push('');
  lines.push(`🏆 ${report.winner === 'GOOD' ? '善良阵营' : '邪恶阵营'}胜利!`);
  lines.push(`📝 ${report.winReason}`);
  lines.push('');
  lines.push('───────────────────────────────────────');
  lines.push('👥 玩家列表');
  lines.push('───────────────────────────────────────');
  
  report.playerSummaries.forEach((player, index) => {
    const status = player.isDead ? '☠️' : '✅';
    const mislead = player.wasMisled ? ' [伪装]' : '';
    const tainted = player.wasTainted ? ' [受影响]' : '';
    lines.push(`${index + 1}. ${status} ${player.name} - ${player.realRole || '未知'}${mislead}${tainted}`);
  });
  
  lines.push('');
  lines.push('───────────────────────────────────────');
  lines.push('📊 统计数据');
  lines.push('───────────────────────────────────────');
  lines.push(`💀 死亡人数: ${report.statistics.totalDeaths}`);
  lines.push(`🗳️ 投票次数: ${report.statistics.totalVotes}`);
  lines.push(`⚖️ 处决人数: ${report.statistics.totalExecutions}`);
  
  if (report.mvp) {
    lines.push('');
    lines.push(`🌟 MVP: ${report.mvp.name} (${report.mvp.realRole})`);
  }
  
  lines.push('');
  lines.push('═══════════════════════════════════════');
  lines.push('Generated by Grimoire Web');
  
  return lines.join('\n');
}

/**
 * 导出为 JSON 格式（用于存档）
 */
export function exportReportAsJson(report: AfterActionReport): string {
  return JSON.stringify(report, null, 2);
}
