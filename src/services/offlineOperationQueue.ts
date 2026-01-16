/**
 * Background Sync API - 离线操作队列
 *
 * 功能：
 * 1. 缓存离线时的游戏操作（投票、夜间行动等）
 * 2. 网络恢复时自动同步
 * 3. 支持优先级队列
 */

import { generateShortId } from '../lib/random';

// GameState type is available but not currently used in this module
// import { GameState } from '../types';

export type OfflineOperation =
    | { type: 'raise_hand'; seatId: number }
    | { type: 'lower_hand'; seatId: number }
    | { type: 'night_action'; seatId: number; roleId: string; payload: Record<string, unknown> }
    | { type: 'send_message'; content: string; recipientId?: number }
    | { type: 'update_reminder'; seatId: number; reminderId: string };

interface QueuedOperation {
    id: string;
    operation: OfflineOperation;
    timestamp: number;
    retryCount: number;
    priority: 'high' | 'normal' | 'low';
}

const QUEUE_STORAGE_KEY = 'grimoire_offline_queue';
const MAX_RETRIES = 3;

/**
 * 离线操作队列管理器
 */
export class OfflineOperationQueue {
    private static instance: OfflineOperationQueue;
    private queue: QueuedOperation[] = [];
    private isSyncing = false;
    private onSyncCallbacks: ((success: boolean) => void)[] = [];

    private constructor() {
        this.loadFromStorage();
        this.setupNetworkListener();
    }

    static getInstance(): OfflineOperationQueue {
         
        if (!OfflineOperationQueue.instance) {
            OfflineOperationQueue.instance = new OfflineOperationQueue();
        }
        return OfflineOperationQueue.instance;
    }

    /**
     * 添加操作到队列
     */
    async enqueue(
        operation: OfflineOperation,
        priority: 'high' | 'normal' | 'low' = 'normal'
    ): Promise<string> {
        const id = this.generateId();
        const item: QueuedOperation = {
            id,
            operation,
            timestamp: Date.now(),
            retryCount: 0,
            priority,
        };

        this.queue.push(item);

        // 按优先级排序
        this.sortQueue();

        // 立即保存到存储
        this.saveToStorage();

        console.log(`✓ Operation queued: ${id}`, operation);

        // 如果网络已连接，尝试立即同步
        if (navigator.onLine) {
            await this.sync();
        }

        return id;
    }

    /**
     * 从队列移除操作
     */
    remove(operationId: string): boolean {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => item.id !== operationId);

        if (this.queue.length < initialLength) {
            this.saveToStorage();
            return true;
        }

        return false;
    }

    /**
     * 获取队列状态
     */
    getQueueStatus() {
        return {
            totalCount: this.queue.length,
            highPriority: this.queue.filter(i => i.priority === 'high').length,
            normalPriority: this.queue.filter(i => i.priority === 'normal').length,
            lowPriority: this.queue.filter(i => i.priority === 'low').length,
            isSyncing: this.isSyncing,
        };
    }

    /**
     * 同步所有待处理操作
     */
    async sync(): Promise<boolean> {
        if (this.isSyncing || this.queue.length === 0) {
            return true;
        }

        this.isSyncing = true;
        console.log(`✓ Starting sync of ${String(this.queue.length)} operations...`);

        let successCount = 0;
        const failedIds = new Set<string>();

        for (const item of this.queue) {
            try {
                const success = await this.executeOperation(item.operation);

                if (success) {
                    this.remove(item.id);
                    successCount++;
                } else {
                    item.retryCount++;

                    if (item.retryCount >= MAX_RETRIES) {
                        failedIds.add(item.id);
                        console.warn(`✗ Operation failed after ${String(MAX_RETRIES)} retries: ${item.id}`);
                    }
                }
            } catch (error) {
                console.error(`✗ Error executing operation: ${item.id}`, error);
                item.retryCount++;

                if (item.retryCount >= MAX_RETRIES) {
                    failedIds.add(item.id);
                }
            }
        }

        this.isSyncing = false;
        this.saveToStorage();

        const isFullSuccess = failedIds.size === 0;

        console.log(
            `✓ Sync complete: ${String(successCount)} succeeded, ${String(failedIds.size)} failed`
        );

        // 触发回调
        this.onSyncCallbacks.forEach(cb => cb(isFullSuccess));

        return isFullSuccess;
    }

    /**
     * 订阅同步完成事件
     */
    onSync(callback: (success: boolean) => void): () => void {
        this.onSyncCallbacks.push(callback);

        // 返回取消订阅函数
        return () => {
            this.onSyncCallbacks = this.onSyncCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * 清空队列
     */
    clear(): void {
        this.queue = [];
        this.saveToStorage();
        console.log('✓ Queue cleared');
    }

    // ============================================================
    // Private Methods
    // ============================================================

    /**
     * 执行单个操作（发送到服务器）
     *
     * 注意: 需要从应用状态获取 userId 和 roomId
     * 建议在应用初始化时设置这些值
     */
    private async executeOperation(operation: OfflineOperation): Promise<boolean> {
        try {
            // TODO: 从应用状态或本地存储获取这些值
            const userId = localStorage.getItem('userId') ?? 'unknown';
            const roomId = localStorage.getItem('roomId') ?? 'unknown';

            const response = await fetch('/api/game/operation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
                },
                body: JSON.stringify({
                    userId,
                    roomId,
                    operations: [operation],
                }),
            });

            if (!response.ok) {
                const errorData: unknown = await response.json().catch(() => ({}));
                console.warn(`✗ Operation failed: ${String(response.status)}`, errorData);
                return false;
            }

            const result: unknown = await response.json();
            console.log('✓ Operation synced successfully:', result);
            return (
                typeof result === 'object' &&
                result !== null &&
                'success' in result &&
                result.success === true
            );

        } catch (error) {
            console.error('✗ Error executing operation:', error);
            return false;
        }
    }

    /**
     * 按优先级排序队列
     */
    private sortQueue(): void {
        const priorityOrder = { high: 0, normal: 1, low: 2 };

        this.queue.sort((a, b) => {
            // 优先级高的优先
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // 相同优先级按时间排序（早的优先）
            return a.timestamp - b.timestamp;
        });
    }

    /**
     * 保存到本地存储
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.warn('Failed to save queue to storage:', error);
        }
    }

    /**
     * 从本地存储加载
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
            if (stored) {
                const parsed: unknown = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.queue = parsed as QueuedOperation[];
                    console.log(`✓ Loaded ${String(this.queue.length)} operations from storage`);
                }
            }
        } catch (error) {
            console.warn('Failed to load queue from storage:', error);
            this.queue = [];
        }
    }

    /**
     * 设置网络状态监听
     */
    private setupNetworkListener(): void {
        window.addEventListener('online', () => {
            console.log('📡 Network restored, syncing operations...');
            void this.sync();
        });

        window.addEventListener('offline', () => {
            console.log('📵 Network lost, operations will be queued');
        });
    }

    /**
     * 生成唯一 ID
     */
    private generateId(): string {
        return `op_${String(Date.now())}_${generateShortId()}`;
    }
}

// ============================================================
// React Hook 集成
// ============================================================

import { useEffect, useState } from 'react';

export const useOfflineQueue = () => {
    const queue = OfflineOperationQueue.getInstance();
    const [status, setStatus] = useState(queue.getQueueStatus());
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // 订阅同步事件
        const unsubscribe = queue.onSync(() => {
            setStatus(queue.getQueueStatus());
        });

        // 监听网络状态
        const handleOnline = () => {
            setIsOnline(true);
            setStatus(queue.getQueueStatus());
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            unsubscribe();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [queue]);

    return {
        queue,
        status,
        isOnline,
        enqueue: (op: OfflineOperation, priority?: 'high' | 'normal' | 'low') =>
            queue.enqueue(op, priority),
        sync: () => queue.sync(),
        clear: () => queue.clear(),
    };
};

export const offlineQueue = OfflineOperationQueue.getInstance();
