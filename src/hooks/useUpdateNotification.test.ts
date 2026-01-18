/**
 * useUpdateNotification Tests
 *
 * Tests for Service Worker update detection hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdateNotification } from './useUpdateNotification';

describe('useUpdateNotification', () => {
  let originalServiceWorker: ServiceWorkerContainer | undefined;
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let mockGetRegistrations: ReturnType<typeof vi.fn>;
  let controllerChangeHandler: (() => void) | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    originalServiceWorker = navigator.serviceWorker;

    mockAddEventListener = vi.fn((event, handler) => {
      if (event === 'controllerchange') {
        controllerChangeHandler = handler;
      }
    });
    mockRemoveEventListener = vi.fn();
    mockGetRegistrations = vi.fn().mockResolvedValue([]);

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        getRegistrations: mockGetRegistrations,
        controller: null,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    controllerChangeHandler = null;

    // Restore original
    if (originalServiceWorker !== undefined) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      });
    }
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useUpdateNotification());

    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.refreshing).toBe(false);
    expect(typeof result.current.handleRefresh).toBe('function');
    expect(typeof result.current.handleDismiss).toBe('function');
  });

  it('should add event listener for controllerchange on mount', () => {
    renderHook(() => useUpdateNotification());

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function)
    );
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useUpdateNotification());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function)
    );
  });

  it('should set updateAvailable to true when controllerchange event fires', () => {
    const { result } = renderHook(() => useUpdateNotification());

    expect(result.current.updateAvailable).toBe(false);

    // Simulate controllerchange event
    act(() => {
      if (controllerChangeHandler) {
        controllerChangeHandler();
      }
    });

    expect(result.current.updateAvailable).toBe(true);
  });

  it('should handle dismiss', () => {
    const { result } = renderHook(() => useUpdateNotification());

    // First trigger update available
    act(() => {
      if (controllerChangeHandler) {
        controllerChangeHandler();
      }
    });
    expect(result.current.updateAvailable).toBe(true);

    // Then dismiss
    act(() => {
      result.current.handleDismiss();
    });

    expect(result.current.updateAvailable).toBe(false);
  });

  it('should handle refresh', async () => {
    const mockPostMessage = vi.fn();
    mockGetRegistrations.mockResolvedValue([
      { waiting: { postMessage: mockPostMessage } },
    ]);

    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      configurable: true,
    });

    const { result } = renderHook(() => useUpdateNotification());

    act(() => {
      result.current.handleRefresh();
    });

    expect(result.current.refreshing).toBe(true);

    // Wait for async operations
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockGetRegistrations).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(mockReload).toHaveBeenCalled();
  });

  it('should do nothing if service worker is not supported', () => {
    // Create a new navigator-like object without serviceWorker property
    const originalNavigator = global.navigator;
    const navigatorWithoutSW = Object.create(originalNavigator, {
      serviceWorker: {
        get: () => undefined,
        configurable: true,
      },
    });
    // Remove serviceWorker property from the navigator object
    Object.defineProperty(navigatorWithoutSW, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true
    });

    // Mock the navigator
    vi.stubGlobal('navigator', {});

    const { result } = renderHook(() => useUpdateNotification());

    expect(result.current.updateAvailable).toBe(false);

    // Restore
    vi.stubGlobal('navigator', originalNavigator);
  });

  describe('with active controller', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          addEventListener: mockAddEventListener,
          removeEventListener: mockRemoveEventListener,
          getRegistrations: mockGetRegistrations,
          controller: {}, // Has active controller
        },
        configurable: true,
      });
    });

    it('should check for waiting service workers periodically', async () => {
      mockGetRegistrations.mockResolvedValue([
        { waiting: {} }, // Has waiting worker
      ]);

      renderHook(() => useUpdateNotification());

      // Advance timers by 60 seconds (check interval)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      expect(mockGetRegistrations).toHaveBeenCalled();
    });

    it('should set updateAvailable when waiting worker is found', async () => {
      mockGetRegistrations.mockResolvedValue([
        { waiting: {} },
      ]);

      const { result } = renderHook(() => useUpdateNotification());

      // Advance timers by 60 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      expect(result.current.updateAvailable).toBe(true);
    });

    it('should clear interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useUpdateNotification());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should handle getRegistrations error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetRegistrations.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useUpdateNotification());

      // Advance timers by 60 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to check service worker registrations:',
        expect.any(Error)
      );
      expect(result.current.updateAvailable).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('handleRefresh edge cases', () => {
    it('should handle missing waiting worker gracefully', async () => {
      mockGetRegistrations.mockResolvedValue([
        {}, // No waiting worker
      ]);

      const { result } = renderHook(() => useUpdateNotification());

      act(() => {
        result.current.handleRefresh();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should not throw
      expect(result.current.refreshing).toBe(true);
    });

    it('should handle getRegistrations error in handleRefresh', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetRegistrations.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useUpdateNotification());

      act(() => {
        result.current.handleRefresh();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get service worker registrations:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
