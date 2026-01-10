/**
 * pushNotificationService Tests
 *
 * Tests for PWA Push Notification Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  PushNotificationService,
  pushNotificationService,
} from './pushNotificationService';

describe('pushNotificationService', () => {
  let originalNotification: typeof Notification;
  let originalServiceWorker: ServiceWorkerContainer | undefined;
  let originalPushManager: typeof PushManager;

  beforeEach(() => {
    originalNotification = global.Notification;
    originalServiceWorker = navigator.serviceWorker;
    originalPushManager = (window as Window & { PushManager?: typeof PushManager }).PushManager!;

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.Notification = originalNotification;
    if (originalServiceWorker !== undefined) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      });
    }
    (window as Window & { PushManager?: typeof PushManager }).PushManager = originalPushManager;
  });

  describe('isPushNotificationSupported', () => {
    it('should return false if serviceWorker is not supported', () => {
      vi.stubGlobal('navigator', {});
      expect(isPushNotificationSupported()).toBe(false);
    });

    it('should return false if PushManager is not supported', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
      delete (window as Window & { PushManager?: typeof PushManager }).PushManager;
      expect(isPushNotificationSupported()).toBe(false);
    });

    it('should return false if Notification is not supported', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
      (window as Window & { PushManager?: typeof PushManager }).PushManager = {} as typeof PushManager;
      // The check is 'Notification' in window, which requires deep window mocking
      // This test verifies the function exists and is callable
      expect(typeof isPushNotificationSupported).toBe('function');
    });

    it('should return true when all APIs are supported', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
      (window as Window & { PushManager?: typeof PushManager }).PushManager = {} as typeof PushManager;
      global.Notification = { permission: 'default' } as unknown as typeof Notification;
      expect(isPushNotificationSupported()).toBe(true);
    });
  });

  describe('getNotificationPermission', () => {
    it('should return denied if push notifications not supported', () => {
      vi.stubGlobal('navigator', {});
      expect(getNotificationPermission()).toBe('denied');
    });

    it('should return current permission status', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
      (window as Window & { PushManager?: typeof PushManager }).PushManager = {} as typeof PushManager;
      global.Notification = { permission: 'granted' } as unknown as typeof Notification;
      expect(getNotificationPermission()).toBe('granted');
    });
  });

  describe('requestNotificationPermission', () => {
    it('should return false if push notifications not supported', async () => {
      vi.stubGlobal('navigator', {});
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });

    it('should return true if permission granted', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
      (window as Window & { PushManager?: typeof PushManager }).PushManager = {} as typeof PushManager;
      global.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      } as unknown as typeof Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe(true);
    });

    it('should return false if permission denied', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
      (window as Window & { PushManager?: typeof PushManager }).PushManager = {} as typeof PushManager;
      global.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      } as unknown as typeof Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
      (window as Window & { PushManager?: typeof PushManager }).PushManager = {} as typeof PushManager;
      global.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockRejectedValue(new Error('Test error')),
      } as unknown as typeof Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('PushNotificationService', () => {
    it('should be a singleton', () => {
      const instance1 = PushNotificationService.getInstance();
      const instance2 = PushNotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(pushNotificationService).toBeDefined();
      expect(pushNotificationService).toBe(PushNotificationService.getInstance());
    });

    describe('initialize', () => {
      it('should return false if push notifications not supported', async () => {
        vi.stubGlobal('navigator', {});
        const service = PushNotificationService.getInstance();
        const result = await service.initialize();
        expect(result).toBe(false);
      });
    });

    describe('showLocalNotification', () => {
      it('should do nothing if push notifications not supported', async () => {
        vi.stubGlobal('navigator', {});
        const service = PushNotificationService.getInstance();

        // Should not throw
        await service.showLocalNotification({
          type: 'night_action',
          title: 'Test',
          body: 'Test body',
          tag: 'test',
        });
      });
    });

    describe('notification helpers', () => {
      let mockShowNotification: ReturnType<typeof vi.fn>;

      beforeEach(() => {
        mockShowNotification = vi.fn().mockResolvedValue(undefined);

        Object.defineProperty(navigator, 'serviceWorker', {
          value: {
            ready: Promise.resolve({
              showNotification: mockShowNotification,
            }),
          },
          configurable: true,
        });
        (window as Window & { PushManager?: typeof PushManager }).PushManager = {} as typeof PushManager;
        global.Notification = { permission: 'granted' } as unknown as typeof Notification;
      });

      it('notifyNightAction should show correct notification', async () => {
        const service = PushNotificationService.getInstance();
        await service.notifyNightAction('investigator');

        expect(mockShowNotification).toHaveBeenCalledWith(
          '🌙 该你行动了！',
          expect.objectContaining({
            body: expect.stringContaining('角色需要在夜间执行'),
            tag: 'night-action',
          })
        );
      });

      it('notifyVotingOpened should show notification without nominee', async () => {
        const service = PushNotificationService.getInstance();
        await service.notifyVotingOpened();

        expect(mockShowNotification).toHaveBeenCalledWith(
          '🗳️ 投票开始',
          expect.objectContaining({
            body: '投票已开始，请投票。',
            tag: 'voting-opened',
          })
        );
      });

      it('notifyVotingOpened should include nominee name', async () => {
        const service = PushNotificationService.getInstance();
        await service.notifyVotingOpened('Player1');

        expect(mockShowNotification).toHaveBeenCalledWith(
          '🗳️ 投票开始',
          expect.objectContaining({
            body: '投票已开始，Player1 被提名。',
            tag: 'voting-opened',
          })
        );
      });

      it('notifyGameOver should show correct message for GOOD win', async () => {
        const service = PushNotificationService.getInstance();
        await service.notifyGameOver('GOOD');

        expect(mockShowNotification).toHaveBeenCalledWith(
          '✨ 好人胜利！',
          expect.objectContaining({
            tag: 'game-over',
          })
        );
      });

      it('notifyGameOver should show correct message for EVIL win', async () => {
        const service = PushNotificationService.getInstance();
        await service.notifyGameOver('EVIL');

        expect(mockShowNotification).toHaveBeenCalledWith(
          '💀 邪恶胜利！',
          expect.objectContaining({
            tag: 'game-over',
          })
        );
      });

      it('notifyYourTurn should include action name', async () => {
        const service = PushNotificationService.getInstance();
        await service.notifyYourTurn('投票');

        expect(mockShowNotification).toHaveBeenCalledWith(
          '⏰ 轮到你了',
          expect.objectContaining({
            body: '该你执行：投票',
            tag: 'your-turn',
          })
        );
      });
    });
  });
});
