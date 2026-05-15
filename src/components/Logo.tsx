import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 64, className = '', glow = true }) => {
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          filter: glow ? 'drop-shadow(0 0 20px rgba(99,102,241,0.5)) drop-shadow(0 0 40px rgba(255,255,255,0.2))' : 'none',
          animation: 'vBreathe 4s ease-in-out infinite'
        }}
      >
        <defs>
          <linearGradient id="v-grad-left" x1="17" y1="14" x2="32" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="v-grad-right" x1="47" y1="14" x2="32" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.4" />
          </linearGradient>
          <filter id="v-glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Shadow/Depth layer */}
        <path d="M17 16 L32 54" stroke="rgba(0,0,0,0.4)" strokeWidth="6" strokeLinecap="round" />
        <path d="M47 16 L32 54" stroke="rgba(0,0,0,0.4)" strokeWidth="6" strokeLinecap="round" />

        {/* Main strokes */}
        <path d="M17 14 L32 52" stroke="url(#v-grad-left)" strokeWidth="5.5" strokeLinecap="round" filter="url(#v-glow)" />
        <path d="M47 14 L32 52" stroke="url(#v-grad-right)" strokeWidth="5.5" strokeLinecap="round" filter="url(#v-glow)" />

        {/* Highlight Core */}
        <circle cx="32" cy="52" r="3" fill="white" style={{ filter: 'blur(2px)' }}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      <style>{`
        @keyframes vBreathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.02); filter: brightness(1.2); }
        }
      `}</style>
    </div>
  );
};

export default Logo;
