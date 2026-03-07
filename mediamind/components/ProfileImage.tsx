import React, { useState, useEffect } from 'react';

interface ProfileImageProps {
  src: string | null;
  alt: string;
  size: number;
  className?: string;
  fallbackClassName?: string;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({ 
  src, 
  alt, 
  size, 
  className = '', 
  fallbackClassName = '' 
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src) {
      // For Google Photos URLs, add size parameter
      if (src.includes('googleusercontent.com')) {
        setImageSrc(`${src}=s${size}-c`);
      } else {
        setImageSrc(src);
      }
      setHasError(false);
      setIsLoading(true);
    } else {
      setImageSrc(`https://via.placeholder.com/${size}`);
      setHasError(false);
      setIsLoading(false);
    }
  }, [src, size]);

  const handleError = () => {
    console.log('❌ Profile image failed to load:', imageSrc);
    
    if (src && src.includes('googleusercontent.com') && !imageSrc.includes('=s')) {
      // Try with size parameter
      const newSrc = `${src}=s${size}-c`;
      console.log('🔄 Retrying with size parameter:', newSrc);
      setImageSrc(newSrc);
      return;
    }
    
    // Fallback to placeholder
    console.log('🔄 Using placeholder fallback');
    setImageSrc(`https://via.placeholder.com/${size}`);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log('✅ Profile image loaded successfully:', imageSrc);
    setIsLoading(false);
    setHasError(false);
  };

  // Show initial letter fallback if no src or error with placeholder
  if (!src || (hasError && imageSrc.includes('placeholder'))) {
    const initial = alt.charAt(0).toUpperCase();
    return (
      <div 
        className={`${fallbackClassName} bg-purple-500 flex items-center justify-center text-white font-bold`}
        style={{ width: size, height: size }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={handleError}
      onLoad={handleLoad}
      style={{ 
        width: size, 
        height: size,
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.2s ease'
      }}
    />
  );
};