import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Flame, Dumbbell, ChevronRight, Scale } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { calculateBMR, calculateTDEE } from '../lib/planGenerator';
import CalorieRing from '../components/CalorieRing';
import WeightStreak, { calcStreak } from '../components/WeightStreak';

function greeting(profile) {
  const h    = new Date().getHours();
  const name = profile?.full_name?.split(' ')[0] || 'Champion';
  if (h < 5)  return { text: `Night owl, ${name}`,      emoji: '🌙' };
  if (h < 10) return { text: `Good morning, ${name}`,   emoji: '☀️' };
  if (h < 13) return { text: `Morning, ${name}`,        emoji: '⚡' };
  if (h < 17) return { text: `Afternoon, ${name}`,      emoji: '🔥' };
  if (h < 21) return { text: `Good evening, ${name}`,   emoji: '🌅' };
  return             { text: `Evening, ${name}`,         emoji: '🌙' };
}

function motivationalTip(profile) {
  const h = new Date().getHours();
  const goal = profile?.goal_type;
  if (h < 10) return goal === 'lose' ? 'Great time for a fasted workout 💪' : 'Fuel up with a high-protein breakfast.';
  if (h < 14) return 'Log your lunch to stay on track.';
  if (h < 18) return goal === 'gain' ? 'Pre-workout meal time.' : 'Afternoon is prime training time.';
  return 'Don\'t forget to log dinner and update your weight.';
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayLogs, setTodayLogs] = useState([]);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const goal        = profile?.daily_calorie_goal || 2000;
  const proteinGoal = profile?.daily_protein_goal || 150;
  const carbGoal    = profile?.daily_carb_goal    || 250;
  const fatGoal     = profile?.daily_fat_goal     || 65;

  const fetchData = useCallback(() => {
    if (!user) return;
    const foodData    = db.food_logs.filter(l => l.user_id === user.id && l.logged_at === today);
    const workoutData = db.workout_logs.filter(w => w.user_id === user.id && w.logged_at === today);
    const wLogs       = db.weight_logs.filter(l => l.user_id === user.id).sort((a, b) => b.logged_at.localeCompare(a.logged_at));
    setTodayLogs(foodData);
    setTodayWorkouts(workoutData);
    setWeightLogs(wLogs);
    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCals    = todayLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalProtein = todayLogs.reduce((s, l) => s + (Number(l.protein_g) || 0), 0);
  const totalCarbs   = todayLogs.reduce((s, l) => s + (Number(l.carbs_g) || 0), 0);
  const totalFat     = todayLogs.reduce((s, l) => s + (Number(l.fat_g) || 0), 0);
  const burnedCals   = todayWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const netCals      = totalCals - burnedCals;

  const streak      = calcStreak(weightLogs);
  const latestWeight = weightLogs[0]?.weight_kg ?? profile?.weight_kg;
  const todayWeightLogged = weightLogs.some(l => l.logged_at === today);

  const bmr  = calculateBMR(profile);
  const tdee = calculateTDEE(profile);

  const { text: greetText, emoji: greetEmoji } = greeting(profile);
  const tip = motivationalTip(profile);

  const macros = [
    { label: 'Protein', value: Math.round(totalProtein), goal: proteinGoal, color: 'var(--protein-c)' },
    { label: 'Carbs',   value: Math.round(totalCarbs),   goal: carbGoal,    color: 'var(--carbs-c)'   },
    { label: 'Fat',     value: Math.round(totalFat),     goal: fatGoal,     color: 'var(--fat-c)'     },
  ];

  const recentLogs = [...todayLogs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{greetText}</span>
            <span>{greetEmoji}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontWeight: 500 }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fire)', marginTop: 4, fontWeight: 600 }}>{tip}</div>
        </div>
        <button
          className="btn-icon"
          onClick={() => navigate('/weight')}
          style={{ flexShrink: 0, marginTop: 2 }}
          title="Weight tracker"
        >
          <Scale size={20} />
        </button>
      </div>

      {/* ── Weight streak banner ── */}
      <div style={{ margin: '14px 20px 0' }}>
        <button
          onClick={() => navigate('/weight')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(0,207,255,0.05))',
            border: '1px solid rgba(255,92,0,0.18)',
            borderRadius: 'var(--r-lg)',
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <WeightStreak streak={streak} weightLogs={weightLogs} />
            <div style={{ borderLeft: '1px solid var(--border-hi)', paddingLeft: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {latestWeight ? `${latestWeight} kg` : 'No weight logged'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                {todayWeightLogged ? '✓ Logged today' : '⚠ Log today\'s weight'}
              </div>
              {bmr && (
                <div style={{ fontSize: 11, color: 'var(--elec)', marginTop: 3, fontWeight: 600 }}>
                  BMR {bmr.toLocaleString()} · TDEE {tdee?.toLocaleString()} kcal
                </div>
              )}
            </div>
          </div>
          <ChevronRight size={16} color="var(--muted)" />
        </button>
      </div>

      {/* ── Calorie ring ── */}
      <div className="dashboard-hero" style={{ margin: '14px 20px 16px' }}>
        <div className="dashboard-date">
          Goal: <strong style={{ color: 'var(--text)' }}>{goal.toLocaleString()}</strong> kcal
          {burnedCals > 0 && <span style={{ color: 'var(--neon)', marginLeft: 8 }}>· burned {burnedCals}</span>}
        </div>
        {loading
          ? <div className="spinner" style={{ margin: '40px 0' }} />
          : <CalorieRing consumed={netCals} goal={goal} size={200} />
        }
      </div>

      {/* ── Macros ── */}
      <div className="macro-row">
        {macros.map(m => (
          <div key={m.label} className="macro-card">
            <div className="macro-card-label">{m.label}</div>
            <div className="macro-card-value" style={{ color: m.color }}>{m.value}g</div>
            <div className="macro-card-goal">/ {m.goal}g</div>
            <div className="macro-bar">
              <div className="macro-bar-fill" style={{ width: `${Math.min((m.value / m.goal) * 100, 100)}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick stats ── */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--fire-dim)' }}>
            <Flame size={18} color="var(--fire)" />
          </div>
          <div className="stat-value">{totalCals.toLocaleString()}</div>
          <div className="stat-label">Calories Eaten</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--neon-dim)' }}>
            <Dumbbell size={18} color="var(--neon)" />
          </div>
          <div className="stat-value">{burnedCals.toLocaleString()}</div>
          <div className="stat-label">Calories Burned</div>
        </div>
      </div>

      {/* ── Today's food ── */}
      <div className="section-header">
        <div className="section-title">Today's Food</div>
        <span className="section-action" onClick={() => navigate('/log')}>See all</span>
      </div>

      {!loading && recentLogs.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 40px' }}>
          <div className="empty-state-icon"><Flame size={28} /></div>
          <h3>Nothing logged yet</h3>
          <p>Tap Log or the camera to add your first meal.</p>
        </div>
      ) : (
        <div style={{ padding: '0 20px' }}>
          {recentLogs.map(log => (
            <div key={log.id} className="food-item">
              <div className="food-item-left">
                <div className="food-item-name">{log.food_name}</div>
                <div className="food-item-meta">{log.meal_type} · {log.quantity} {log.unit}</div>
              </div>
              <div className="food-item-right">
                <div className="food-item-cals">{log.calories}</div>
                <div className="food-item-macros">
                  P{Math.round(log.protein_g)}·C{Math.round(log.carbs_g)}·F{Math.round(log.fat_g)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}
