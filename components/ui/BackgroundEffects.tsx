import React from 'react';

export const BackgroundEffects: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-bg)_0%,_#000000_100%)] opacity-80" />

            {/* Fog Layers */}
            <div className="absolute inset-0 opacity-30 animate-float" style={{ animationDuration: '20s' }}>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://raw.githubusercontent.com/transparenttextures/patterns/master/foggy-birds.png')] bg-repeat opacity-20" />
            </div>

            <div className="absolute inset-0 opacity-20 animate-float" style={{ animationDuration: '30s', animationDirection: 'reverse' }}>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://raw.githubusercontent.com/transparenttextures/patterns/master/foggy-birds.png')] bg-repeat opacity-20" style={{ transform: 'rotate(90deg)' }} />
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

            {/* Dust Particles (CSS only implementation for performance) */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute w-1 h-1 bg-white rounded-full top-1/4 left-1/4 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-3/4 left-1/3 animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-1/2 left-2/3 animate-pulse" style={{ animationDuration: '5s' }} />
                <div className="absolute w-1 h-1 bg-white rounded-full top-1/3 left-3/4 animate-pulse" style={{ animationDuration: '7s' }} />
            </div>
        </div>
    );
};
