import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'gradient';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'light', 
  showText = true, 
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const variantClasses = {
    light: 'text-white',
    dark: 'text-gray-900',
    gradient: 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'
  };

  const LogoIcon = () => (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        fill="none"
      >
        <defs>
          <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: variant === 'light' ? '#ffffff' : variant === 'dark' ? '#1f2937' : '#06b6d4', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: variant === 'light' ? '#ffffff' : variant === 'dark' ? '#1f2937' : '#3b82f6', stopOpacity: 1}} />
          </linearGradient>
          <linearGradient id="letterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: variant === 'light' ? '#ffffff' : variant === 'dark' ? '#1f2937' : '#06b6d4', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: variant === 'light' ? '#ffffff' : variant === 'dark' ? '#1f2937' : '#8b5cf6', stopOpacity: 1}} />
          </linearGradient>
        </defs>
        
        {/* Modern square frame with rounded corners */}
        <rect
          x="15"
          y="15"
          width="70"
          height="70"
          rx="8"
          ry="8"
          stroke={variant === 'gradient' ? 'url(#frameGradient)' : 'currentColor'}
          strokeWidth="3"
          fill="none"
        />
        
        {/* Letter "M" */}
        <path
          d="M30 65 L30 35 L40 50 L50 35 L60 50 L70 35 L70 65"
          stroke={variant === 'gradient' ? 'url(#letterGradient)' : 'currentColor'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Modern accent dots */}
        <circle cx="25" cy="25" r="2" fill={variant === 'gradient' ? 'url(#frameGradient)' : 'currentColor'} opacity="0.8" />
        <circle cx="75" cy="75" r="2" fill={variant === 'gradient' ? 'url(#frameGradient)' : 'currentColor'} opacity="0.8" />
      </svg>
    </div>
  );

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={variant === 'gradient' ? 'text-cyan-500' : variantClasses[variant]}>
        <LogoIcon />
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} ${variantClasses[variant]}`}>
          MediaMind AI
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg"
      >
        {content}
      </button>
    );
  }

  return content;
};