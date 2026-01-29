'use client';

import React from 'react';

export const Logo = ({ size = 24, className = "" }: { size?: number, className?: string }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className="flex items-center justify-center rounded-xl bg-[#0c3b92] shadow-sm"
        style={{ width: size * 1.6, height: size * 1.6 }}
      >
        <svg 
           width={size} 
           height={size} 
           viewBox="0 0 24 24" 
           fill="none" 
           xmlns="http://www.w3.org/2000/svg"
           className="text-white"
        >
          <path 
            d="M12 2L3 7V17L12 22L21 17V7L12 2Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M12 22V12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M21 7L12 12L3 7" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M12 12L21 17" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M12 12L3 17" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">
        TruFund
      </span>
    </div>
  );
};
