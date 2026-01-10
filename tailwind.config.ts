import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gothic: {
          bg: '#0a0505',
          'bg-dark': '#050303',
          surface: '#12121a',
          card: '#1a1a24',
          border: '#2a2a3a',
          text: '#e0d0b0',
          muted: '#8a7040',
          accent: '#c0a060',
          'accent-dim': '#8a7040',
          blood: '#991b1b',
          'blood-bright': '#dc2626',
          holy: '#fbbf24',
          evil: '#7c3aed',
          overlay: 'rgba(0, 0, 0, 0.7)',
          'overlay-red': 'rgba(40, 10, 10, 0.6)'
        }
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif']
      },
      animation: {
        'breath': 'breath 3s ease-in-out infinite',
        'breath-slow': 'breath 4s ease-in-out infinite',
        'tremble': 'tremble 0.3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'clock-pulse': 'clock-pulse 1s ease-in-out infinite',
        'blood-drip': 'bloodDrip 2s ease-in-out forwards',
        'ghost-float': 'ghostFloat 3s ease-in-out infinite',
        'candle-flicker': 'candleFlicker 0.15s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite'
      },
      keyframes: {
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' }
        },
        tremble: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-1px, 0)' },
          '20%': { transform: 'translate(1px, -1px)' },
          '30%': { transform: 'translate(-1px, 1px)' },
          '40%': { transform: 'translate(1px, 0)' },
          '50%': { transform: 'translate(-1px, -1px)' },
          '60%': { transform: 'translate(1px, 1px)' },
          '70%': { transform: 'translate(0, -1px)' },
          '80%': { transform: 'translate(-1px, 0)' },
          '90%': { transform: 'translate(1px, -1px)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' }
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(192, 160, 96, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(192, 160, 96, 0.5)' }
        },
        'clock-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.3)' }
        },
        bloodDrip: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' }
        },
        ghostFloat: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.6' },
          '25%': { transform: 'translateY(-10px) translateX(5px)', opacity: '0.8' },
          '50%': { transform: 'translateY(-5px) translateX(-5px)', opacity: '0.5' },
          '75%': { transform: 'translateY(-15px) translateX(3px)', opacity: '0.7' }
        },
        candleFlicker: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(0.98)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(192, 160, 96, 0.3)',
        'glow-strong': '0 0 30px rgba(192, 160, 96, 0.5)',
        'blood': '0 0 15px rgba(220, 38, 38, 0.4)',
        'blood-strong': '0 0 25px rgba(220, 38, 38, 0.6)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.2)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(192, 160, 96, 0.1)'
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px'
      },
      zIndex: {
        'base': '0',
        'card': '10',
        'dropdown': '20',
        'sticky': '25',
        'modal': '30',
        'toast': '40',
        'tooltip': '50',
        'overlay': '100'
      },
      transitionTimingFunction: {
        'gothic': 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      backgroundImage: {
        'gradient-gothic': 'linear-gradient(to bottom, rgba(50, 15, 15, 0.9), rgba(25, 5, 5, 0.95))',
        'gradient-gold': 'linear-gradient(90deg, transparent, rgba(192, 160, 96, 0.2), transparent)'
      }
    }
  },
  plugins: []
} satisfies Config
