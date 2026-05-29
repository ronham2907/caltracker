import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { calculateBMR, calculateTDEE, calculateCalorieTarget } from '../lib/planGenerator';
import WeightStreak, { calcStreak } from '../components/WeightStreak';
import Toast from '../components/Toast';

export default function WeightTracker() {
  const { user, profile, updateProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [todayWeight, setTodayWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchLogs = useCallback(() => {
    if (!user) return;
    const data = db.weight_logs
      .filter(l => l.user_id === user.id)
      .sort((a, b) => b.logged_at.localeCompare(a.logged_at));
    setLogs(data);

    // Pre-fill today's value if already logged
    const todayLog = data.find(l => l.logged_at === today);
    if (todayLog) setTodayWeight(String(todayLog.weight_kg));
  }, [user, today]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const todayLogged = logs.some(l => l.logged_at === today);
  const streak = calcStreak(logs);

  const latestWeight = logs[0]?.weight_kg ?? profile?.weight_kg ?? null;
  const startWeight  = logs.length ? logs[logs.length - 1].weight_kg : latestWeight;
  const goalWeight   = profile?.goal_weight ?? null;
  const diff         = latestWeight && startWeight ? (Number(latestWeight) - Number(startWeight)).toFixed(1) : null;

  const bmr  = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const cTarget = calculateCalorieTarget(profile);

  function handleLog(e) {
    e.preventDefault();
    if (!todayWeight) return;
    setSaving(true);

    // Remove existing today entry if any
    const existing = logs.find(l => l.logged_at === today);
    if (existing) db.weight_logs.delete(existing.id);

    db.weight_logs.insert({
      user_id:   user.id,
      logged_at: today,
      weight_kg: parseFloat(todayWeight),
    });

    // Keep profile weight synced
    updateProfile({ weight_kg: parseFloat(todayWeight) });

    setSaving(false);
    fetchLogs();

    const newStreak = calcStreak([...logs.filter(l => l.logged_at !== today), { logged_at: today }]);
    if (newStreak > 0 && newStreak % 7 === 0) {
      setToast({ msg: `🔥 ${newStreak}-day streak! You're on fire!`, type: 'success' });
    } else if (!todayLogged) {
      setToast({ msg: `Weight logged! Streak: ${newStreak} day${newStreak !== 1 ? 's' : ''} 🔥`, type: 'success' });
    } else {
      setToast({ msg: 'Updated!', type: 'success' });
    }
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const log = logs.find(l => l.logged_at === d);
    return { date: d, weight: log?.weight_kg ?? null, label: format(subDays(new Date(), 6 - i), 'EEE') };
  });

  const chartMax = Math.max(...last7.map(d => d.weight ?? 0)) + 2;
  const chartMin = Math.max(0, Math.min(...last7.map(d => d.weight ?? 999).filter(w => w < 999)) - 2);

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Weight</div>
          <div className="page-subtitle">
            {latestWeight ? `Current: ${latestWeight} kg` : 'Start tracking today'}
          </div>
        </div>
      </div>

      {/* ── Streak card ── */}
      <div style={{ margin: '0 20px 16px' }}>
        <div className="card-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
          <WeightStreak streak={streak} weightLogs={logs} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-2)', marginBottom: 4 }}>
              Log streak
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
              {streak === 0
                ? 'Log today to start!'
                : streak >= 7
                ? '🏆 Amazing consistency!'
                : streak >= 3
                ? '💪 Keep it up!'
                : 'Great start!'}
            </div>
            {goalWeight && latestWeight && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--fire)', fontWeight: 700 }}>
                {Math.abs(Number(latestWeight) - Number(goalWeight)).toFixed(1)} kg to goal
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Log today's weight ── */}
      <div style={{ margin: '0 20px 16px' }}>
        <div className="card-fire" style={{ padding: '22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--fire)', marginBottom: 14 }}>
            {todayLogged ? "Update Today's Weight" : "Log Today's Weight"}
          </div>
          <form onSubmit={handleLog} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  placeholder={latestWeight || '70.0'}
                  value={todayWeight}
                  onChange={e => setTodayWeight(e.target.value)}
                  style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', padding: '16px', letterSpacing: '-0.5px' }}
                  required
                />
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>
                  kg
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: 58, padding: '0 24px', fontSize: 15 }}
              disabled={saving}
            >
              {saving ? '…' : todayLogged ? 'Update' : '+ Log'}
            </button>
          </form>
        </div>
      </div>

      {/* ── 7-day mini chart ── */}
      {last7.some(d => d.weight !== null) && (
        <div style={{ margin: '0 20px 16px' }}>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 16 }}>
              Last 7 Days
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {last7.map(({ date, weight, label }) => {
                const pct = weight ? ((weight - chartMin) / (chartMax - chartMin)) * 100 : 0;
                const isToday = date === today;
                return (
                  <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    {weight && (
                      <div style={{ fontSize: 9, fontWeight: 700, color: isToday ? 'var(--fire)' : 'var(--text-2)', marginBottom: 2 }}>
                        {weight}
                      </div>
                    )}
                    <div style={{
                      width: '100%',
                      height: weight ? `${Math.max(pct, 8)}%` : '8%',
                      background: weight
                        ? (isToday ? 'var(--fire)' : 'rgba(255,92,0,0.4)')
                        : 'var(--border)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.4s ease',
                      boxShadow: isToday && weight ? '0 0 8px var(--fire-glow)' : 'none',
                    }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: isToday ? 'var(--fire)' : 'var(--muted)', textTransform: 'uppercase' }}>
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
            {diff !== null && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: Number(diff) < 0 ? 'var(--neon)' : Number(diff) > 0 ? 'var(--danger)' : 'var(--text-2)', fontWeight: 700 }}>
                {Number(diff) < 0 ? <TrendingDown size={16} /> : Number(diff) > 0 ? <TrendingUp size={16} /> : <Minus size={16} />}
                {Number(diff) > 0 ? '+' : ''}{diff} kg since you started
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BMR / TDEE card ── */}
      {bmr && (
        <div style={{ margin: '0 20px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10, paddingLeft: 2 }}>
            Your Metabolism
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'BMR',    value: bmr.toLocaleString(),    unit: 'kcal/day', color: 'var(--elec)',   tip: 'Calories at rest' },
              { label: 'TDEE',   value: tdee?.toLocaleString(),  unit: 'kcal/day', color: 'var(--fire)',   tip: 'With activity' },
              { label: 'Target', value: cTarget?.toLocaleString(),unit:'kcal/day', color: 'var(--neon)',   tip: 'For your goal' },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-2)', marginBottom: 6 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: item.color, letterSpacing: '-0.5px' }}>
                  {item.value ?? '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{item.tip}</div>
              </div>
            ))}
          </div>
          {!profile?.weight_kg && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)', paddingLeft: 2 }}>
              💡 Set your age, weight & height in Profile for accurate BMR.
            </div>
          )}
        </div>
      )}

      {/* ── History ── */}
      {logs.length > 0 && (
        <div style={{ margin: '0 20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10, paddingLeft: 2 }}>
            History
          </div>
          {logs.slice(0, 14).map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {log.logged_at === today ? 'Today' : format(new Date(log.logged_at + 'T12:00:00'), 'EEE, MMM d')}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: log.logged_at === today ? 'var(--fire)' : 'var(--text)' }}>
                {log.weight_kg} <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>kg</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!bmr && (
        <div style={{ margin: '0 20px 20px', background: 'var(--elec-dim)', border: '1px solid rgba(0,207,255,0.15)', borderRadius: 'var(--r)', padding: '14px 16px', fontSize: 13, color: 'var(--text-2)' }}>
          <Scale size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Add your age, weight and height in <strong style={{ color: 'var(--text)' }}>Profile</strong> to unlock your BMR & TDEE calculator.
        </div>
      )}
    </div>
  );
}
