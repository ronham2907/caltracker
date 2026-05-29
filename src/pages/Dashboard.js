import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Flame, Dumbbell, TrendingUp } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import CalorieRing from '../components/CalorieRing';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayLogs, setTodayLogs] = useState([]);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
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
    setTodayLogs(foodData);
    setTodayWorkouts(workoutData);
    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCals   = todayLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalProtein = todayLogs.reduce((s, l) => s + (Number(l.protein_g) || 0), 0);
  const totalCarbs  = todayLogs.reduce((s, l) => s + (Number(l.carbs_g) || 0), 0);
  const totalFat    = todayLogs.reduce((s, l) => s + (Number(l.fat_g) || 0), 0);
  const burnedCals  = todayWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const netCals     = totalCals - burnedCals;

  const macros = [
    { label: 'Protein', value: Math.round(totalProtein), goal: proteinGoal, color: 'var(--macro-protein)' },
    { label: 'Carbs',   value: Math.round(totalCarbs),   goal: carbGoal,    color: 'var(--macro-carbs)' },
    { label: 'Fat',     value: Math.round(totalFat),     goal: fatGoal,     color: 'var(--macro-fat)' },
  ];

  const recentLogs = [...todayLogs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Hey, {firstName} 👋</div>
          <div className="page-subtitle">{format(new Date(), 'EEEE, MMM d')}</div>
        </div>
        <button className="btn-icon" onClick={() => navigate('/reminders')} title="Reminders">
          <TrendingUp size={20} />
        </button>
      </div>

      {/* Calorie Ring */}
      <div className="dashboard-hero">
        <div className="dashboard-date">
          {format(new Date(), 'MMMM d, yyyy')} · Goal: {goal.toLocaleString()} kcal
        </div>
        {loading
          ? <div className="spinner" style={{ margin: '40px 0' }} />
          : <CalorieRing consumed={netCals} goal={goal} size={200} />
        }
      </div>

      {/* Macros */}
      <div className="macro-row">
        {macros.map(m => (
          <div key={m.label} className="macro-card">
            <div className="macro-card-label">{m.label}</div>
            <div className="macro-card-value" style={{ color: m.color }}>{m.value}g</div>
            <div className="macro-card-goal">/ {m.goal}g</div>
            <div className="macro-bar">
              <div
                className="macro-bar-fill"
                style={{ width: `${Math.min((m.value / m.goal) * 100, 100)}%`, background: m.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-dim)' }}>
            <Flame size={18} color="var(--primary)" />
          </div>
          <div className="stat-value">{totalCals.toLocaleString()}</div>
          <div className="stat-label">Calories Eaten</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-dim)' }}>
            <Dumbbell size={18} color="var(--green)" />
          </div>
          <div className="stat-value">{burnedCals.toLocaleString()}</div>
          <div className="stat-label">Calories Burned</div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="section-header">
        <div className="section-title">Today's Food</div>
        <span className="section-action" onClick={() => navigate('/log')}>See all</span>
      </div>

      {!loading && recentLogs.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 40px' }}>
          <div className="empty-state-icon"><Flame size={28} /></div>
          <h3>Nothing logged yet</h3>
          <p>Tap Log or the camera button to add your first meal.</p>
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
