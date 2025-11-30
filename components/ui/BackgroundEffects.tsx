import React from 'react';

export const BackgroundEffects: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-stone-950">
            {/* 1. Deep Base Gradient - 营造深邃的黑暗基调 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#1c1917_0%,_#0c0a09_40%,_#000000_100%)]" />

            {/* 2. Ambient Color Glows - 增加神秘的氛围光 */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-amber-900/5 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />

            {/* 3. Procedural Fog Layers - 使用 CSS mask 和 gradient 模拟流动迷雾 */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-800/20 to-transparent w-[200%] animate-drift-slow" />
            </div>

            {/* 4. Floating Particles - 悬浮尘埃粒子 */}
            <div className="absolute inset-0">
                {/* 生成一些随机位置的粒子 */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-amber-100/20 rounded-full blur-[1px]"
                        style={{
                            width: Math.random() * 3 + 1 + 'px',
                            height: Math.random() * 3 + 1 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                            animationDelay: `-${Math.random() * 10}s`,
                            opacity: Math.random() * 0.5 + 0.1,
                        }}
                    />
                ))}
            </div>

            {/* 5. Vignette - 边缘暗角，聚焦视线 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

            {/* 6. Noise Texture - 增加胶片颗粒感 (Optional, using SVG data URI for pure CSS noise) */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
        </div>
    );
};
