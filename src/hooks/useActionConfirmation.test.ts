import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActionConfirmation } from './useActionConfirmation';

describe('useActionConfirmation', () => {
    describe('初始状态', () => {
        it('应该有正确的初始状态', () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            expect(result.current.isOpen).toBe(false);
            expect(result.current.options).toBeNull();
            expect(result.current.inputValue).toBe('');
        });
    });

    describe('requestConfirmation', () => {
        it('应该打开确认框并设置选项', () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            const options = {
                title: '测试标题',
                message: '测试消息',
                type: 'confirm' as const
            };
            
            act(() => {
                void result.current.requestConfirmation(options);
            });
            
            expect(result.current.isOpen).toBe(true);
            expect(result.current.options).toEqual(options);
        });

        it('应该设置默认值', () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            act(() => {
                void result.current.requestConfirmation({
                    title: '测试',
                    message: '消息',
                    defaultValue: '默认值'
                });
            });
            
            expect(result.current.inputValue).toBe('默认值');
        });

        it('应该返回 Promise', () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            let promise: Promise<unknown> | undefined;
            act(() => {
                promise = result.current.requestConfirmation({
                    title: '测试',
                    message: '消息'
                });
            });
            
            expect(promise).toBeInstanceOf(Promise);
        });
    });

    describe('handleConfirm', () => {
        it('应该关闭弹窗并返回确认结果', async () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            let resolvedValue: unknown;
            act(() => {
                void result.current.requestConfirmation({
                    title: '测试',
                    message: '消息'
                }).then(v => { resolvedValue = v; });
            });
            
            act(() => {
                result.current.handleConfirm();
            });
            
            // 等待 Promise resolve
            await waitFor(() => {
                expect(resolvedValue).toEqual({ confirmed: true, value: '' });
            });
            
            expect(result.current.isOpen).toBe(false);
        });

        it('应该返回输入值', async () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            let resolvedValue: { value?: string };
            act(() => {
                void result.current.requestConfirmation({
                    title: '测试',
                    message: '消息',
                    defaultValue: '测试输入'
                }).then(v => { resolvedValue = v; });
            });
            
            act(() => {
                result.current.handleConfirm();
            });
            
            await waitFor(() => {
                expect(resolvedValue.value).toBe('测试输入');
            });
        });
    });

    describe('handleModify', () => {
        it('应该返回修改结果', async () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            let resolvedValue: unknown;
            act(() => {
                void result.current.requestConfirmation({
                    title: '测试',
                    message: '消息',
                    type: 'confirm-modify'
                }).then(v => { resolvedValue = v; });
            });
            
            act(() => {
                result.current.handleModify();
            });
            
            await waitFor(() => {
                expect(resolvedValue).toEqual({ 
                    confirmed: true, 
                    modified: true, 
                    value: '' 
                });
            });
        });
    });

    describe('handleCancel', () => {
        it('应该返回取消结果', async () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            let resolvedValue: unknown;
            act(() => {
                void result.current.requestConfirmation({
                    title: '测试',
                    message: '消息'
                }).then(v => { resolvedValue = v; });
            });
            
            act(() => {
                result.current.handleCancel();
            });
            
            await waitFor(() => {
                expect(resolvedValue).toEqual({ confirmed: false });
            });
            
            expect(result.current.isOpen).toBe(false);
        });
    });

    describe('handleInputChange', () => {
        it('应该更新输入值', () => {
            const { result } = renderHook(() => useActionConfirmation());
            
            act(() => {
                void result.current.requestConfirmation({
                    title: '测试',
                    message: '消息'
                });
            });
            
            act(() => {
                result.current.handleInputChange('新输入值');
            });
            
            expect(result.current.inputValue).toBe('新输入值');
        });
    });
});
