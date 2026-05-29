import React from 'react';

export default function Logo({ size = 48 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`fire-${s}`} x1="24" y1="36" x2="24" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FF1A00" />
          <stop offset="40%"  stopColor="#FF5C00" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
        <linearGradient id={`metal-${s}`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#D0D0D8" />
          <stop offset="50%"  stopColor="#888898" />
          <stop offset="100%" stopColor="#B0B0C0" />
        </linearGradient>
        <linearGradient id={`plate-${s}`} x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#A0A0B0" />
          <stop offset="50%"  stopColor="#D8D8E8" />
          <stop offset="100%" stopColor="#A0A0B0" />
        </linearGradient>
        <filter id={`glow-${s}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`softglow-${s}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ambient glow behind flame */}
      <ellipse cx="24" cy="20" rx="10" ry="13" fill="#FF5C00" opacity="0.15" />

      {/* ── Dumbbell ── */}
      {/* Bar */}
      <rect x="10" y="33" width="28" height="4.5" rx="2.25" fill={`url(#metal-${s})`} />
      {/* Left outer plate */}
      <rect x="5"  y="26" width="7"  height="18" rx="3.5" fill={`url(#plate-${s})`} />
      {/* Left inner collar */}
      <rect x="11" y="29" width="3"  height="12" rx="1.5" fill={`url(#metal-${s})`} />
      {/* Right inner collar */}
      <rect x="34" y="29" width="3"  height="12" rx="1.5" fill={`url(#metal-${s})`} />
      {/* Right outer plate */}
      <rect x="36" y="26" width="7"  height="18" rx="3.5" fill={`url(#plate-${s})`} />

      {/* ── Flame (rises from dumbbell bar) ── */}
      <path
        d="M24 5
           C24 5 30 11 30 18
           C30 18 32 14 31 10
           C31 10 37 16 37 24
           C37 31 31 37 24 37
           C17 37 11 31 11 24
           C11 16 17 10 17 10
           C16 14 18 18 18 18
           C18 11 24 5 24 5Z"
        fill={`url(#fire-${s})`}
        filter={`url(#softglow-${s})`}
      />

      {/* Inner flame highlight */}
      <path
        d="M24 12
           C24 12 27.5 16.5 27.5 21
           C27.5 21 29 18 28.5 15
           C28.5 15 31 19 31 23.5
           C31 28 28 32 24 33
           C20 32 17 28 17 23.5
           C17 19 19.5 15 19.5 15
           C19 18 20.5 21 20.5 21
           C20.5 16.5 24 12 24 12Z"
        fill="#FFD060"
        opacity="0.45"
      />

      {/* Lightning bolt */}
      <path
        d="M26.5 13 L21 23 L24.5 23 L22 32 L29 21 L25 21 Z"
        fill="white"
        opacity="0.92"
        filter={`url(#glow-${s})`}
      />
    </svg>
  );
}
