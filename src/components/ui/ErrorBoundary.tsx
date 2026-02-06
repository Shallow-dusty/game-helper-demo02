import { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '../../i18n';
import { captureException } from '../../lib/monitoring';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的 JavaScript 错误，防止整个应用崩溃
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
        captureException(error, {
            source: 'ErrorBoundary',
            componentStack: errorInfo.componentStack,
        });
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // 如果提供了自定义 fallback，使用它
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 默认错误 UI
            return (
                <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-stone-900 border border-red-900/50 rounded-lg p-6 shadow-2xl">
                        <div className="text-center mb-6">
                            <span className="text-6xl">💀</span>
                            <h1 className="text-2xl font-bold text-red-400 mt-4 font-cinzel">
                                Something Went Wrong
                            </h1>
                            <p className="text-stone-400 mt-2 text-sm">
                                {i18n.t('ui.errorBoundary.title')}
                            </p>
                        </div>

                        {/* 错误详情（开发环境） */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded text-xs">
                                <div className="text-red-400 font-bold mb-1">{i18n.t('ui.errorBoundary.errorDetails')}:</div>
                                <pre className="text-red-300 whitespace-pre-wrap break-words">
                                    {this.state.error.message}
                                </pre>
                                {this.state.errorInfo && (
                                    <>
                                        <div className="text-red-400 font-bold mt-2 mb-1">Stack:</div>
                                        <pre className="text-red-300/70 whitespace-pre-wrap break-words text-[10px] max-h-32 overflow-y-auto">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-amber-200 rounded font-bold transition-colors"
                            >
                                {i18n.t('ui.errorBoundary.retryButton')}
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-bold transition-colors"
                            >
                                {i18n.t('ui.errorBoundary.refreshButton')}
                            </button>
                        </div>

                        {/* 帮助链接 */}
                        <p className="text-center text-stone-600 text-xs mt-4">
                            {i18n.t('ui.errorBoundary.helpText')}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;


