/**
 * AI 编年史模块 (AI Chronicler)
 * 
 * 负责收集游戏事件并生成叙事性回顾
 * 为 AI 提供结构化的游戏上下文
 */

import { GameState } from '../types';
import { ROLES } from '../constants/roles';

/**
 * 游戏事件类型
 */
export interface GameEvent {
    id: string;
    timestamp: number;
    type: 
        | 'game_start'
        | 'phase_change'
        | 'nomination'
        | 'vote_start'
        | 'vote_cast'
        | 'vote_end'
        | 'execution'
        | 'death'
        | 'resurrection'
        | 'ability_use'
        | 'info_reveal'
        | 'whisper'
        | 'game_end';
    round: number;
    phase: string;
    actor?: number;        // 发起者座位号
    target?: number;       // 目标座位号
    targets?: number[];    // 多目标
    result?: string;       // 结果
    details: string;       // 详细描述
    metadata?: Record<string, unknown>;
}

/**
 * 叙事片段
 */
export interface NarrativeSegment {
    round: number;
    dayEvents: string[];
    nightEvents: string[];
    summary: string;
    tension: number; // 0-1 紧张程度
}

/**
 * 编年史记录
 */
export interface ChronicleRecord {
    gameId: string;
    events: GameEvent[];
    narrative: NarrativeSegment[];
    currentContext: string;
    keyMoments: GameEvent[];
}

/**
 * AI 编年史收集器
 */
export class AIChronicler {
    private events: GameEvent[] = [];
    private currentRound = 1;
    private currentPhase = 'DAY';
    private eventIdCounter = 0;

    /**
     * 记录游戏开始事件
     */
    recordGameStart(playerCount: number, scriptName: string): void {
        this.addEvent({
            type: 'game_start',
            details: `游戏开始：${String(playerCount)}名玩家，剧本「${scriptName}」`,
            metadata: { playerCount, scriptName }
        });
    }

    /**
     * 记录阶段变更
     */
    recordPhaseChange(newPhase: string, round: number): void {
        this.currentPhase = newPhase;
        this.currentRound = round;
        
        const phaseNames: Record<string, string> = {
            'DAY': '白天',
            'NIGHT': '夜晚',
            'NOMINATION': '提名阶段',
            'VOTING': '投票阶段',
            'SETUP': '准备阶段',
            'FINISHED': '游戏结束'
        };
        
        this.addEvent({
            type: 'phase_change',
            details: `进入第${String(round)}轮 ${phaseNames[newPhase] ?? newPhase}`,
            metadata: { phase: newPhase, round }
        });
    }

    /**
     * 记录提名事件
     */
    recordNomination(nominatorSeatId: number, nomineeSeatId: number, nominatorName: string, nomineeName: string): void {
        this.addEvent({
            type: 'nomination',
            actor: nominatorSeatId,
            target: nomineeSeatId,
            details: `${nominatorName}（${String(nominatorSeatId)}号位）提名了${nomineeName}（${String(nomineeSeatId)}号位）`,
            metadata: { nominatorName, nomineeName }
        });
    }

    /**
     * 记录投票事件
     */
    recordVoteCast(voterSeatId: number, targetSeatId: number, voterName: string, isGhostVote: boolean): void {
        this.addEvent({
            type: 'vote_cast',
            actor: voterSeatId,
            target: targetSeatId,
            details: isGhostVote
                ? `👻 ${voterName}（${String(voterSeatId)}号位）使用了幽灵投票`
                : `${voterName}（${String(voterSeatId)}号位）投了赞成票`,
            metadata: { voterName, isGhostVote }
        });
    }

    /**
     * 记录投票结果
     */
    recordVoteResult(nomineeSeatId: number, nomineeName: string, voteCount: number, required: number, result: 'executed' | 'survived' | 'cancelled'): void {
        const resultText = result === 'executed' 
            ? '被处决' 
            : result === 'survived' 
                ? '幸存' 
                : '投票取消';
                
        this.addEvent({
            type: 'vote_end',
            target: nomineeSeatId,
            result,
            details: `${nomineeName}（${String(nomineeSeatId)}号位）获得${String(voteCount)}票（需要${String(required)}票），${resultText}`,
            metadata: { voteCount, required, result }
        });
    }

    /**
     * 记录处决
     */
    recordExecution(seatId: number, playerName: string, roleName: string): void {
        this.addEvent({
            type: 'execution',
            target: seatId,
            details: `⚰️ ${playerName}（${String(seatId)}号位）被处决，真实身份是${roleName}`,
            metadata: { roleName }
        });
    }

    /**
     * 记录死亡（夜杀等）
     */
    recordDeath(seatId: number, playerName: string, cause: string, roleName?: string): void {
        this.addEvent({
            type: 'death',
            target: seatId,
            details: `💀 ${playerName}（${String(seatId)}号位）${cause}${roleName ? `，真实身份是${roleName}` : ''}`,
            metadata: { cause, roleName }
        });
    }

    /**
     * 记录能力使用
     */
    recordAbilityUse(actorSeatId: number, ability: string, targetSeatIds?: number[], result?: string): void {
        const targetText = targetSeatIds?.length
            ? `目标：${targetSeatIds.join(', ')}号位`
            : '';

        this.addEvent({
            type: 'ability_use',
            actor: actorSeatId,
            targets: targetSeatIds,
            result,
            details: `🔮 ${String(actorSeatId)}号位使用了${ability}${targetText ? `，${targetText}` : ''}${result ? `，结果：${result}` : ''}`,
            metadata: { ability, result }
        });
    }

    /**
     * 记录信息揭示
     */
    recordInfoReveal(seatId: number, info: string): void {
        this.addEvent({
            type: 'info_reveal',
            target: seatId,
            details: `📜 ${String(seatId)}号位获得信息：${info}`
        });
    }

    /**
     * 记录私聊
     */
    recordWhisper(fromSeatId: number, toSeatId: number): void {
        this.addEvent({
            type: 'whisper',
            actor: fromSeatId,
            target: toSeatId,
            details: `🌫️ ${String(fromSeatId)}号位与${String(toSeatId)}号位进行私聊`
        });
    }

    /**
     * 记录游戏结束
     */
    recordGameEnd(winner: 'GOOD' | 'EVIL', reason: string): void {
        this.addEvent({
            type: 'game_end',
            result: winner,
            details: `🏆 游戏结束！${winner === 'GOOD' ? '善良阵营' : '邪恶阵营'}获胜：${reason}`,
            metadata: { winner, reason }
        });
    }

    /**
     * 添加事件
     */
    private addEvent(event: Omit<GameEvent, 'id' | 'timestamp' | 'round' | 'phase'>): void {
        this.events.push({
            id: `event-${String(++this.eventIdCounter)}`,
            timestamp: Date.now(),
            round: this.currentRound,
            phase: this.currentPhase,
            ...event
        });
    }

    /**
     * 生成叙事性回顾
     */
    generateNarrative(): NarrativeSegment[] {
        const segments: NarrativeSegment[] = [];
        const eventsByRound = new Map<number, GameEvent[]>();
        
        // 按轮次分组
        this.events.forEach(event => {
            const round = event.round;
            if (!eventsByRound.has(round)) {
                eventsByRound.set(round, []);
            }
            const roundEvents = eventsByRound.get(round);
            if (roundEvents) {
                roundEvents.push(event);
            }
        });
        
        // 生成每轮叙事
        eventsByRound.forEach((events, round) => {
            const dayEvents = events.filter(e => e.phase === 'DAY' || e.phase === 'NOMINATION' || e.phase === 'VOTING');
            const nightEvents = events.filter(e => e.phase === 'NIGHT');
            
            // 计算紧张度
            const deathCount = events.filter(e => e.type === 'death' || e.type === 'execution').length;
            const voteCount = events.filter(e => e.type === 'vote_cast').length;
            const tension = Math.min(1, (deathCount * 0.3 + voteCount * 0.05));
            
            segments.push({
                round,
                dayEvents: dayEvents.map(e => e.details),
                nightEvents: nightEvents.map(e => e.details),
                summary: this.summarizeRound(events),
                tension
            });
        });
        
        return segments;
    }

    /**
     * 生成轮次摘要
     */
    private summarizeRound(events: GameEvent[]): string {
        const deaths = events.filter(e => e.type === 'death' || e.type === 'execution');
        const votes = events.filter(e => e.type === 'vote_end');
        
        if (deaths.length === 0 && votes.length === 0) {
            return '平静的一轮';
        }
        
        const parts: string[] = [];
        
        if (deaths.length > 0) {
            parts.push(`${String(deaths.length)}人死亡`);
        }

        if (votes.length > 0) {
            const executed = votes.filter(v => v.result === 'executed').length;
            const survived = votes.filter(v => v.result === 'survived').length;
            if (executed > 0) parts.push(`${String(executed)}人被处决`);
            if (survived > 0) parts.push(`${String(survived)}人幸存`);
        }
        
        return parts.join('，');
    }

    /**
     * 获取当前游戏上下文（用于 AI）
     */
    getCurrentContext(): string {
        const recentEvents = this.events.slice(-10);
        const narrative = this.generateNarrative();
        const latestRound = narrative[narrative.length - 1];
        
        let context = `当前游戏状态：第${String(this.currentRound)}轮 ${this.currentPhase}\n\n`;

        if (latestRound) {
            context += `本轮概述：${latestRound.summary}\n`;
            context += `紧张程度：${String(Math.round(latestRound.tension * 100))}%\n\n`;
        }
        
        context += `最近事件：\n`;
        recentEvents.forEach(event => {
            context += `- ${event.details}\n`;
        });
        
        return context;
    }

    /**
     * 获取关键时刻（高影响力事件）
     */
    getKeyMoments(): GameEvent[] {
        return this.events.filter(event => 
            event.type === 'execution' ||
            event.type === 'game_end' ||
            (event.type === 'death' && event.metadata?.cause !== 'execution') ||
            (event.type === 'vote_end' && typeof event.metadata?.voteCount === 'number' && event.metadata.voteCount >= 5)
        );
    }

    /**
     * 获取完整编年史记录
     */
    getChronicle(gameId: string): ChronicleRecord {
        return {
            gameId,
            events: [...this.events],
            narrative: this.generateNarrative(),
            currentContext: this.getCurrentContext(),
            keyMoments: this.getKeyMoments()
        };
    }

    /**
     * 从游戏状态同步事件
     */
    syncFromGameState(gameState: GameState): void {
        // 同步投票历史
        gameState.voteHistory.forEach((vote, index) => {
            const eventId = `vote-${String(index)}`;
            if (!this.events.find(e => e.id === eventId)) {
                const nominee = gameState.seats.find(s => s.id === vote.nomineeSeatId);
                const nominator = gameState.seats.find(s => s.id === vote.nominatorSeatId);

                this.events.push({
                    id: eventId,
                    timestamp: vote.timestamp,
                    round: vote.round,
                    phase: 'VOTING',
                    type: 'vote_end',
                    actor: vote.nominatorSeatId,
                    target: vote.nomineeSeatId,
                    result: vote.result,
                    details: `${nominator?.userName ?? '?'} 提名 ${nominee?.userName ?? '?'}，${String(vote.voteCount)}票，${vote.result}`,
                    metadata: { voteCount: vote.voteCount, result: vote.result }
                });
            }
        });
        
        // 同步死亡信息
        gameState.seats.forEach(seat => {
            if (seat.isDead) {
                const deathEventId = `death-${String(seat.id)}`;
                if (!this.events.find(e => e.id === deathEventId)) {
                    const roleId = seat.realRoleId ?? seat.seenRoleId;
                    const role = roleId ? ROLES[roleId] : null;
                    this.events.push({
                        id: deathEventId,
                        timestamp: Date.now(),
                        round: this.currentRound,
                        phase: this.currentPhase,
                        type: 'death',
                        target: seat.id,
                        details: `${seat.userName}（${String(seat.id)}号位）已死亡${role ? `，身份${role.name}` : ''}`,
                        metadata: { roleName: role ? role.name : undefined }
                    });
                }
            }
        });
    }

    /**
     * 清空事件
     */
    reset(): void {
        this.events = [];
        this.currentRound = 1;
        this.currentPhase = 'DAY';
        this.eventIdCounter = 0;
    }

    /**
     * 获取所有事件
     */
    getEvents(): GameEvent[] {
        return [...this.events];
    }
}

// 单例实例
export const chronicler = new AIChronicler();

export default AIChronicler;
