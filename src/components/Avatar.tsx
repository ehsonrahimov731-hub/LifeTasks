import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = (name.trim().charAt(0) || 'К').toUpperCase();

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${SIZE_CLASSES[size]} rounded-full object-cover bg-slate-200 dark:bg-slate-800 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${SIZE_CLASSES[size]} rounded-full bg-teal-700/15 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 font-semibold flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {initial}
    </div>
  );
};
