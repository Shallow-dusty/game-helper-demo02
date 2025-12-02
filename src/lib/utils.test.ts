import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('应该合并基础类名', () => {
            const result = cn('a', 'b');
            expect(result).toBe('a b');
        });

        it('应该处理条件类名', () => {
            const isActive = false as boolean;
            const result = cn('a', isActive && 'b', 'c');
            expect(result).toBe('a c');
        });

        it('应该处理对象语法', () => {
            const result = cn({ a: true, b: false });
            expect(result).toBe('a');
        });

        it('应该处理数组语法', () => {
            const result = cn(['a', 'b']);
            expect(result).toBe('a b');
        });

        it('应该解决 Tailwind 类名冲突', () => {
            const result = cn('p-2', 'p-4');
            expect(result).toBe('p-4');
        });

        it('应该解决复杂 Tailwind 冲突', () => {
            const result = cn('px-2 py-1', 'p-4');
            expect(result).toBe('p-4');
        });

        it('应该处理空输入', () => {
            const result = cn();
            expect(result).toBe('');
        });

        it('应该忽略 undefined 和 null', () => {
            const result = cn('a', undefined, null, 'b');
            expect(result).toBe('a b');
        });

        it('应该处理混合语法', () => {
            const isActive = true as boolean;
            const isDisabled = false as boolean;
            const result = cn(
                'base-class',
                { 'active': isActive, 'disabled': isDisabled },
                ['array-class'],
                isActive && 'conditional-class'
            );
            expect(result).toContain('base-class');
            expect(result).toContain('active');
            expect(result).toContain('array-class');
            expect(result).toContain('conditional-class');
            expect(result).not.toContain('disabled');
        });

        it('应该正确处理 Tailwind 变体', () => {
            const result = cn('hover:bg-red-500', 'hover:bg-blue-500');
            expect(result).toBe('hover:bg-blue-500');
        });
    });
});
