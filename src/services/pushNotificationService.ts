import { buildJsonHeaders, getPushSubscriptionEndpoint } from '../lib/apiEndpoints';
import { supabase } from '../store/slices/connection';

import { createLogger } from '../lib/logger';
const logger = createLogger('PushNotification');

/**
 * PWA Push Notification Service
 *
 * 功能：
 * 1. 请求用户通知权限
 * 2. 订阅推送通知
 * 3. 在 Service Worker 中处理推送事件
 * 4. 显示游戏相关通知（轮到你行动、游戏结束等）
 */

// ============================================================
// 浏览器支持检查
// ============================================================

export const isPushNotificationSupported = (): boolean => {
    if (!('serviceWorker' in navigator)) return false;
    if (!('PushManager' in window)) return false;
    if (!('Notification' in window)) return false;
    return true;
};

// ============================================================
// 通知权限管理
// ============================================================

export type NotificationPermission = 'granted' | 'denied' | 'default';

export const getNotificationPermission = (): NotificationPermission => {
    if (!isPushNotificationSupported()) return 'denied';
    return Notification.permission as NotificationPermission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isPushNotificationSupported()) {
        logger.warn('Push notifications not supported');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        logger.error('Error requesting notification permission:', error);
        return false;
    }
};

// ============================================================
// Push Notification Manager
// ============================================================

interface PushSubscriptionJSON {
    endpoint: string;
    keys: {
        auth: string;
        p256dh: string;
    };
}

interface GameNotificationPayload {
    type: 'night_action' | 'voting_opened' | 'game_over' | 'your_turn' | 'role_revealed';
    title: string;
    body: string;
    data?: Record<string, unknown>;
    tag: string;
    icon?: string;
    badge?: string;
}

export class PushNotificationService {
    private static instance: PushNotificationService | undefined;

    // eslint-disable-next-line @typescript-eslint/no-empty-function -- Singleton pattern requires empty private constructor
    private constructor() {}

    static getInstance(): PushNotificationService {
        PushNotificationService.instance ??= new PushNotificationService();
        return PushNotificationService.instance;
    }

    /**
     * 初始化推送通知 - 订阅并保存订阅信息
     */
    async initialize(): Promise<boolean> {
        if (!isPushNotificationSupported()) {
            logger.warn('Push notifications not supported in this browser');
            return false;
        }

        try {
            const permission = await requestNotificationPermission();
            if (!permission) {
                logger.info('User denied notification permission');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await this.getOrCreateSubscription(registration);

            if (subscription) {
                // 保存订阅信息到服务器（可选）
                await this.saveSubscriptionToServer(subscription);
                logger.info('✓ Push notification initialized');
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error initializing push notifications:', error);
            return false;
        }
    }

    /**
     * 获取或创建推送订阅
     */
    private async getOrCreateSubscription(
        registration: ServiceWorkerRegistration
    ): Promise<PushSubscription | null> {
        try {
            // 尝试获取现有订阅
            let subscription = await registration.pushManager.getSubscription();

            // 创建新订阅（如果没有现有订阅）
            subscription ??= await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''
                ),
            });

            return subscription;
        } catch (error) {
            logger.error('Error getting/creating push subscription:', error);
            return null;
        }
    }

    /**
     * 保存订阅到服务器
     */
    private async saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            const subscriptionJSON: PushSubscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;
            const endpoint = getPushSubscriptionEndpoint();
            const roomCode = localStorage.getItem('grimoire_last_room');
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers: buildJsonHeaders(endpoint, accessToken),
                body: JSON.stringify({
                    ...subscriptionJSON,
                    roomCode,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new Error(`Subscription save failed (${String(response.status)}): ${errorBody}`);
            }

            logger.info('✓ Subscription saved to server');
        } catch (error) {
            logger.error('Error saving subscription to server:', error);
            // 继续执行，订阅仍然有效
        }
    }

    /**
     * 取消订阅
     */
    async unsubscribe(): Promise<boolean> {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                logger.info('✓ Unsubscribed from push notifications');
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error unsubscribing:', error);
            return false;
        }
    }

    /**
     * 显示本地通知（不需要服务器）
     */
    async showLocalNotification(options: GameNotificationPayload): Promise<void> {
        if (!isPushNotificationSupported()) {
            logger.warn('Push notifications not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // 使用 ServiceWorkerRegistration 显示通知
            await registration.showNotification(options.title, {
                body: options.body,
                icon: options.icon ?? '/img/icon-192.png',
                badge: options.badge ?? '/img/icon-192.png',
                tag: options.tag, // 相同 tag 会替换之前的通知
                data: options.data ?? {},
            });

            logger.info('✓ Notification shown:', options.title);
        } catch (error) {
            logger.error('Error showing notification:', error);
        }
    }

    /**
     * 游戏通知助手函数
     */

    async notifyNightAction(_roleId: string): Promise<void> {
        await this.showLocalNotification({
            type: 'night_action',
            title: '🌙 该你行动了！',
            body: `你的角色需要在夜间执行一个行动。点击打开游戏。`,
            tag: 'night-action',
            icon: '/img/icon-192.png',
        });
    }

    async notifyVotingOpened(nominee?: string): Promise<void> {
        await this.showLocalNotification({
            type: 'voting_opened',
            title: '🗳️ 投票开始',
            body: nominee
                ? `投票已开始，${nominee} 被提名。`
                : '投票已开始，请投票。',
            tag: 'voting-opened',
            icon: '/img/icon-192.png',
        });
    }

    async notifyGameOver(winner: 'GOOD' | 'EVIL'): Promise<void> {
        const title = winner === 'GOOD' ? '✨ 好人胜利！' : '💀 邪恶胜利！';
        await this.showLocalNotification({
            type: 'game_over',
            title,
            body: '游戏结束，快去看看战报。',
            tag: 'game-over',
            icon: '/img/icon-192.png',
        });
    }

    async notifyYourTurn(actionName: string): Promise<void> {
        await this.showLocalNotification({
            type: 'your_turn',
            title: '⏰ 轮到你了',
            body: `该你执行：${actionName}`,
            tag: 'your-turn',
            icon: '/img/icon-192.png',
        });
    }

    /**
     * VAPID Key 转换（Base64 URL 转 Uint8Array）
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }
}

// ============================================================
// 导出单例
// ============================================================

export const pushNotificationService = PushNotificationService.getInstance();
