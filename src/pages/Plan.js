import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Zap, Utensils, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateWorkoutPlan, generateNutritionPlan } from '../lib/planGenerator';
import { db } from '../lib/db';
import Toast from '../components/Toast';

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const TODAY = format(new Date(), 'EEEE'); // e.g. "Monday"

export default function Plan() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('workout');
  const [expanded, setExpanded] = useState(TODAY);
  const [toast, setToast] = useState(null);
  const [loggedMeals, setLoggedMeals] = useState(new Set());
  const { user } = useAuth();

  const workoutPlan  = useMemo(() => generateWorkoutPlan(profile),   [profile]);
  const nutritionPlan = useMemo(() => generateNutritionPlan(profile), [profile]);

  function toggleDay(day) {
    setExpanded(e => e === day ? null : day);
  }

  function logMeal(meal) {
    if (!user) return;
    db.food_logs.insert({
      user_id:   user.id,
      logged_at: format(new Date(), 'yyyy-MM-dd'),
      meal_type: meal.type,
      food_name: meal.name,
      calories:  meal.calories,
      protein_g: Math.round(meal.calories * 0.25 / 4),
      carbs_g:   Math.round(meal.calories * 0.45 / 4),
      fat_g:     Math.round(meal.calories * 0.30 / 9),
      quantity:  1,
      unit:      'serving',
      notes:     'From nutrition plan',
    });
    setLoggedMeals(s => new Set([...s, meal.type]));
    setToast({ msg: `${meal.name} logged!`, type: 'success' });
  }

  const goalLabel = {
    lose: 'Lose Weight', gain: 'Build Muscle', endurance: 'Endurance',
    maintain: 'Stay Fit', health: 'General Health', performance: 'Performance',
  }[profile?.goal_type] || 'Fitness';

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">My Plan</div>
          <div className="page-subtitle">Personalised for: {goalLabel}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="plan-tab-row">
        <button className={`plan-tab${tab === 'workout' ? ' active' : ''}`} onClick={() => setTab('workout')}>
          <Zap size={14} style={{ display: 'inline', marginRight: 5 }} />Workout
        </button>
        <button className={`plan-tab${tab === 'nutrition' ? ' active' : ''}`} onClick={() => setTab('nutrition')}>
          <Utensils size={14} style={{ display: 'inline', marginRight: 5 }} />Nutrition
        </button>
      </div>

      {/* ── Workout Plan ── */}
      {tab === 'workout' && (
        <>
          <div style={{ padding: '0 20px', marginBottom: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px', display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--fire)' }}>{profile?.training_days || 3}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>DAYS / WEEK</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--elec)', textTransform: 'capitalize' }}>{profile?.fitness_level || 'Beginner'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>LEVEL</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--neon)', textTransform: 'capitalize' }}>{profile?.workout_location || 'Home'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>LOCATION</div>
              </div>
            </div>
          </div>

          {workoutPlan.map(day => (
            <div key={day.day} className={`day-card${day.day === TODAY ? ' today' : ''}`}>
              <div className="day-card-header" onClick={() => !day.rest && toggleDay(day.day)}>
                <div style={{ flex: 1 }}>
                  <div className={`day-name${day.day === TODAY ? ' today' : ''}`}>
                    {day.day} {day.day === TODAY && '• Today'}
                  </div>
                  {day.rest
                    ? <div className="day-rest">Rest Day 😴</div>
                    : <>
                        <div className="day-workout-name">{day.name}</div>
                        <div className="day-meta">{day.focus} · {day.duration} min</div>
                      </>
                  }
                </div>
                {!day.rest && (
                  <div style={{ color: 'var(--muted)', flexShrink: 0 }}>
                    {expanded === day.day ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                )}
              </div>

              {!day.rest && expanded === day.day && (
                <div className="day-card-body">
                  {day.exercises.map((ex, i) => (
                    <div key={i} className="exercise-row">
                      <div>
                        <div className="exercise-name">{ex.name}</div>
                        <div className="exercise-detail">{ex.muscle}</div>
                      </div>
                      <div className="exercise-sets">{ex.sets}×{ex.reps}</div>
                    </div>
                  ))}
                  <button
                    className="btn btn-primary btn-full"
                    style={{ marginTop: 16, fontSize: 14 }}
                    onClick={() => setToast({ msg: `${day.name} started! 🔥`, type: 'success' })}
                  >
                    <Zap size={16} /> Start Workout
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── Nutrition Plan ── */}
      {tab === 'nutrition' && (
        <>
          <div style={{ padding: '0 20px', marginBottom: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--fire)' }}>
                  {profile?.daily_calorie_goal || 2000}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>DAILY GOAL (kcal)</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Plan based on your <strong style={{ color: 'var(--text)' }}>{profile?.diet_type?.replace('_',' ') || 'standard'}</strong> diet preference.
                Meals rotate daily.
              </div>
            </div>
          </div>

          {nutritionPlan.map(meal => (
            <div key={meal.type} className="meal-suggestion-card">
              <div style={{ fontSize: 28, flexShrink: 0 }}>{MEAL_ICONS[meal.type]}</div>
              <div className="meal-suggestion-left">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-2)', marginBottom: 3 }}>
                  {meal.type}
                </div>
                <div className="meal-suggestion-title">{meal.name}</div>
                <div className="meal-suggestion-sub">{meal.sub}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div className="meal-suggestion-cals">{meal.calories}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>kcal</div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '7px 12px', fontSize: 12 }}
                  disabled={loggedMeals.has(meal.type)}
                  onClick={() => logMeal(meal)}
                >
                  {loggedMeals.has(meal.type) ? '✓' : <><Plus size={12} /> Log</>}
                </button>
              </div>
            </div>
          ))}

          <div style={{ margin: '0 20px', padding: '14px 16px', background: 'var(--elec-dim)', border: '1px solid rgba(0,207,255,0.15)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            💡 <strong style={{ color: 'var(--text)' }}>Tip:</strong> These are suggestions based on your profile. Tap Log to add them to your food diary.
          </div>
          <div style={{ height: 20 }} />
        </>
      )}
    </div>
  );
}
