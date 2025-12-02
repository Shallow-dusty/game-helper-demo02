/**
 * Custom Test Utilities
 * 
 * 提供带有 Store Provider 的自定义渲染器
 * 用于测试依赖全局状态的组件
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { createStore, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createMockGameState, createMockUser } from './factories';
import { GameState, User } from '../src/types';

// ============================================================================
// Mock Store Types
// ============================================================================

interface MockStoreState {
    user: User | null;
    gameState: GameState | null;
    isOffline: boolean;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
    isAudioBlocked: boolean;
    sync: () => void;
}

// ============================================================================
// Mock Store Creation
// ============================================================================

export const createMockStore = (
    initialUser: User | null = createMockUser(),
    initialGameState: GameState | null = createMockGameState()
): StoreApi<MockStoreState> => {
    return createStore<MockStoreState>()(
        immer(() => ({
            user: initialUser,
            gameState: initialGameState,
            isOffline: false,
            connectionStatus: 'connected' as const,
            isAudioBlocked: false,
            sync: () => { /* mock sync */ },
        }))
    );
};

// ============================================================================
// Store Context (Simplified mock)
// ============================================================================

const StoreContext = React.createContext<StoreApi<MockStoreState> | null>(null);

interface MockStoreProviderProps {
    children: ReactNode;
    store?: StoreApi<MockStoreState>;
}

export const MockStoreProvider: React.FC<MockStoreProviderProps> = ({ 
    children, 
    store = createMockStore() 
}) => {
    return (
        <StoreContext.Provider value={store}>
            {children}
        </StoreContext.Provider>
    );
};

// ============================================================================
// Custom Render
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialUser?: User | null;
    initialGameState?: GameState | null;
    store?: StoreApi<MockStoreState>;
}

/**
 * 自定义渲染器，自动包装 Store Provider
 */
export const customRender = (
    ui: ReactElement,
    {
        initialUser,
        initialGameState,
        store = createMockStore(initialUser, initialGameState),
        ...renderOptions
    }: CustomRenderOptions = {}
) => {
    const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <MockStoreProvider store={store}>
            {children}
        </MockStoreProvider>
    );

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        store,
    };
};

// ============================================================================
// Re-exports
// ============================================================================

// 重新导出 testing-library 的所有内容
export * from '@testing-library/react';

// 用 customRender 覆盖默认的 render
export { customRender as render };
