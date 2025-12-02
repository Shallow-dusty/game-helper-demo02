import { useState, useCallback, useRef } from 'react';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  modifyText?: string;
  type?: 'confirm' | 'confirm-modify' | 'info';
  icon?: React.ReactNode;
  defaultValue?: string;
}

export interface ConfirmationResult {
  confirmed: boolean;
  modified?: boolean;
  value?: string;
}

type ResolveFunc = (result: ConfirmationResult) => void;

/**
 * useActionConfirmation Hook
 * 
 * 用于所有自动化拦截逻辑的确认模态框
 * 支持：确认/取消、确认/修改/取消 两种模式
 * 
 * @example
 * const { requestConfirmation, ConfirmModal } = useActionConfirmation();
 * 
 * // 在需要确认时调用
 * const result = await requestConfirmation({
 *   title: '连锁结算',
 *   message: '检测到孙子已死，是否标记祖母死亡？',
 *   type: 'confirm',
 * });
 * 
 * if (result.confirmed) {
 *   // 执行操作
 * }
 */
export function useActionConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const resolveRef = useRef<ResolveFunc | null>(null);

  const requestConfirmation = useCallback((opts: ConfirmationOptions): Promise<ConfirmationResult> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setInputValue(opts.defaultValue || '');
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.({ confirmed: true, value: inputValue });
    resolveRef.current = null;
  }, [inputValue]);

  const handleModify = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.({ confirmed: true, modified: true, value: inputValue });
    resolveRef.current = null;
  }, [inputValue]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.({ confirmed: false });
    resolveRef.current = null;
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  return {
    isOpen,
    options,
    inputValue,
    requestConfirmation,
    handleConfirm,
    handleModify,
    handleCancel,
    handleInputChange,
  };
}

export default useActionConfirmation;
