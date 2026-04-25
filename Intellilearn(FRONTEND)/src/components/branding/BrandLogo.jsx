import React from 'react';
import { cn } from '@/lib/utils';

function IntelliLearnIcon({ className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('h-10 w-10', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ilOrb" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#0B1229" />
      <path
        d="M22 40L32 35L42 40"
        stroke="url(#ilOrb)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M20 40.5V46.2C20 47.3 20.9 48.2 22 48.2H42C43.1 48.2 44 47.3 44 46.2V40.5"
        stroke="#93C5FD"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 13C24.8 13 19 18.8 19 26C19 30 20.8 33.1 23.7 35.3C24.8 36.1 25.4 37.3 25.4 38.6V39.5H38.6V38.6C38.6 37.3 39.2 36.1 40.3 35.3C43.2 33.1 45 30 45 26C45 18.8 39.2 13 32 13Z"
        stroke="url(#ilOrb)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M32 39.5V31.5" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="28" r="1.6" fill="#BFDBFE" />
      <path d="M26.8 24.6H23.8M40.2 24.6H37.2" stroke="#06B6D4" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="22.2" cy="24.6" r="1.2" fill="#22D3EE" />
      <circle cx="41.8" cy="24.6" r="1.2" fill="#22D3EE" />
    </svg>
  );
}

export default function BrandLogo({ iconClassName, className, textClassName, subtitle, compact = false }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <IntelliLearnIcon className={iconClassName} />
      {!compact && (
        <div className="leading-tight">
          <div className={cn('text-xl font-extrabold tracking-tight', textClassName)}>
            <span className="text-blue-400">Intelli</span>
            <span className="text-purple-400">Learn</span>
          </div>
          {subtitle ? (
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{subtitle}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
