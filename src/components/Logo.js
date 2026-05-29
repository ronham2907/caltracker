import React from 'react';

export default function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fire-g" x1="16" y1="44" x2="32" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2200" />
          <stop offset="45%" stopColor="#FF5C00" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
        <linearGradient id="bolt-g" x1="20" y1="28" x2="28" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,1)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow circle */}
      <circle cx="24" cy="24" r="22" fill="url(#fire-g)" opacity="0.12" />

      {/* Flame body */}
      <path
        d="M24 6
           C24 6 30 12 30.5 19
           C30.5 19 32 15 31 11
           C31 11 36 16 36 23
           C36 31 30 37 24 38
           C18 37 12 31 12 23
           C12 16 17 11 17 11
           C16 15 17.5 19 17.5 19
           C18 12 24 6 24 6Z"
        fill="url(#fire-g)"
        filter="url(#glow)"
      />

      {/* Inner flame (lighter) */}
      <path
        d="M24 14
           C24 14 27 18 27.5 22
           C27.5 22 28.5 19.5 28 17
           C28 17 30.5 20 30.5 24
           C30.5 28.5 27.5 32 24 33
           C20.5 32 17.5 28.5 17.5 24
           C17.5 20 20 17 20 17
           C19.5 19.5 20.5 22 20.5 22
           C21 18 24 14 24 14Z"
        fill="#FFB300"
        opacity="0.55"
      />

      {/* Lightning bolt */}
      <path
        d="M26.5 16 L21 24.5 L24.5 24.5 L22 32 L29 22 L25 22 Z"
        fill="url(#bolt-g)"
        filter="url(#glow)"
      />
    </svg>
  );
}
