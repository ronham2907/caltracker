import React from 'react';

export default function CalorieRing({ consumed = 0, goal = 2000, size = 200 }) {
  const radius = (size / 2) - 18;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(consumed / goal, 1);
  const offset = circumference - pct * circumference;
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <div className="calorie-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="14"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isOver ? 'var(--danger)' : 'var(--primary)'}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="calorie-ring-info">
        <div className="calorie-ring-num">{consumed.toLocaleString()}</div>
        <div className="calorie-ring-unit">kcal eaten</div>
        <div className="calorie-ring-sub">{remaining.toLocaleString()} remaining</div>
      </div>
    </div>
  );
}
