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
        style={{ filter: glow ? 'drop-shadow(0 0 35px rgba(99,102,241,0.4))' : 'none' }}
      >
        <defs>
          <linearGradient id="v-grad-high" x1="32" y1="14" x2="32" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="1"/>
            <stop offset="60%" stopColor="white" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="white" stopOpacity="0.1"/>
          </linearGradient>
          <filter id="v-blur">
            <feGaussianBlur stdDeviation="1.2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Tech Base Outline */}
        <path 
          d="M17 14 L32 52 L47 14" 
          stroke="white" 
          strokeWidth="0.5" 
          strokeOpacity="0.1"
          fill="none"
        />

        {/* Primary Beam */}
        <path 
          d="M17 14 L32 52" 
          stroke="url(#v-grad-high)" 
          strokeWidth="4.5" 
          strokeLinecap="square"
          filter="url(#v-blur)"
        />
        
        {/* Ghost Beam */}
        <path 
          d="M47 14 L32 52" 
          stroke="white" 
          strokeWidth="4.5" 
          strokeLinecap="square"
          opacity="0.25"
        />

        {/* Core Precision Wire */}
        <path 
          d="M17 14 L32 52" 
          stroke="white" 
          strokeWidth="1.2" 
          strokeLinecap="square"
          opacity="0.7"
        />
      </svg>
    </div>
  );
};

export default Logo;

