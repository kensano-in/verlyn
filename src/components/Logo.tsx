import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 64, className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        style={{ overflow: 'visible' }}
      >
        {/* Pure Professional Machined V */}
        <path 
          d="M17 18 L32 46 L47 18" 
          stroke="white" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.8))' }}
        />
        
        {/* Optical Alignment Node */}
        <circle cx="32" cy="46" r="2.8" fill="white" />
      </svg>
    </div>
  );
};

export default Logo;
