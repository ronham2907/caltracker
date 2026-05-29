import React from 'react';
import { format, subDays } from 'date-fns';

// Returns how many consecutive days (ending today or yesterday) have a log
export function calcStreak(weightLogs) {
  if (!weightLogs.length) return 0;
  const logged = new Set(weightLogs.map(l => l.logged_at));
  const today = format(new Date(), 'yyyy-MM-dd');
  // streak may end today or yesterday (grace: logged earlier today counts)
  let start = logged.has(today) ? 0 : 1;
  if (start === 1 && !logged.has(format(subDays(new Date(), 1), 'yyyy-MM-dd'))) return 0;
  let streak = 0;
  for (let i = start; i < 400; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (logged.has(d)) streak++;
    else break;
  }
  return streak;
}

export default function WeightStreak({ streak = 0, weightLogs = [] }) {
  // Last 7 days dot indicators
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const logged = weightLogs.some(l => l.logged_at === d);
    const isToday = i === 6;
    return { d, logged, isToday };
  });

  const flameColor = streak === 0 ? '#50506A' : streak >= 7 ? '#FFD700' : '#FF5C00';
  const glowColor  = streak === 0 ? 'transparent' : streak >= 7 ? 'rgba(255,215,0,0.35)' : 'rgba(255,92,0,0.35)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Flame + number */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <svg width="38" height="46" viewBox="0 0 38 46" fill="none" style={{ filter: streak > 0 ? `drop-shadow(0 0 8px ${glowColor})` : 'none' }}>
          <defs>
            <linearGradient id="sf" x1="19" y1="44" x2="19" y2="2" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor={streak === 0 ? '#40405A' : '#FF2200'} />
              <stop offset="50%"  stopColor={streak === 0 ? '#50506A' : '#FF5C00'} />
              <stop offset="100%" stopColor={streak === 0 ? '#606070' : streak >= 7 ? '#FFD700' : '#FFB300'} />
            </linearGradient>
          </defs>
          <path
            d="M19 2 C19 2 26 9 26 17 C26 17 28 12 27 8 C27 8 33 14 33 22 C33 30 27 37 19 38 C11 37 5 30 5 22 C5 14 11 8 11 8 C10 12 12 17 12 17 C12 9 19 2 19 2Z"
            fill="url(#sf)"
          />
          {streak > 0 && (
            <path
              d="M19 10 C19 10 22.5 15 22.5 19.5 C22.5 19.5 24 17 23.5 14 C23.5 14 27 18 27 22 C27 27 23.5 31 19 32 C14.5 31 11 27 11 22 C11 18 14.5 14 14.5 14 C14 17 15.5 19.5 15.5 19.5 C15.5 15 19 10 19 10Z"
              fill="#FFD060"
              opacity="0.45"
            />
          )}
        </svg>
        <div style={{ lineHeight: 1, paddingBottom: 4 }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: flameColor, letterSpacing: '-1px' }}>
            {streak}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {streak === 1 ? 'day streak' : 'day streak'}
      </div>

      {/* 7-day dots */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {dots.map(({ d, logged, isToday }) => (
          <div
            key={d}
            title={d}
            style={{
              width: isToday ? 12 : 10,
              height: isToday ? 12 : 10,
              borderRadius: '50%',
              background: logged
                ? (isToday ? flameColor : 'rgba(255,92,0,0.55)')
                : 'var(--border-hi)',
              border: isToday ? `2px solid ${flameColor}` : 'none',
              transition: 'all 0.2s',
              boxShadow: logged && isToday ? `0 0 6px ${glowColor}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
