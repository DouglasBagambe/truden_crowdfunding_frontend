'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export const Logo = ({ size = 24, className = "" }: { size?: number, className?: string }) => {
  const { resolvedTheme } = useTheme();
  const imgSize = Math.round(size * 1.6);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src={resolvedTheme === 'dark' ? '/logo-dark.jpeg' : '/logo.jpeg'}
        alt="Keibo"
        width={imgSize}
        height={imgSize}
        className="rounded-lg object-contain"
        priority
      />
      <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">
        Keibo
      </span>
    </div>
  );
};
