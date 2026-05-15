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
        style={{ filter: glow ? 'drop-shadow(0 0 15px rgba(255,255,255,0.3))' : 'none' }}
      >
        <defs>
          <linearGradient id="grad-e1" x1="17" y1="14" x2="32" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0.8"/>
          </linearGradient>
          <linearGradient id="grad-e2" x1="47" y1="14" x2="32" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="white" stopOpacity="0.6"/>
          </linearGradient>
        </defs>
        <path d="M17 14 L32 52" stroke="url(#grad-e1)" strokeWidth="5" strokeLinecap="round"/>
        <path d="M47 14 L32 52" stroke="url(#grad-e2)" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    </div>
  );
};

export default Logo;
