import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Zap, Utensils, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateWorkoutPlan, generateNutritionPlan } from '../lib/planGenerator';
import { db } from '../lib/db';
import Toast from '../components/Toast';

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const TODAY = format(new Date(), 'EEEE');

export default function Plan() {
  const { profile, user } = useAuth();
  const [tab, setTab]           = useState('workout');
  const [expanded, setExpanded] = useState(TODAY);
  const [toast, setToast]       = useState(null);

  // Per-meal: which option index is currently shown
  const [mealIdx, setMealIdx]       = useState({ breakfast: 0, lunch: 0, dinner: 0, snack: 0 });
  // Per-meal: has this meal been logged today
  const [loggedMeals, setLoggedMeals] = useState(new Set());

  const workoutPlan   = useMemo(() => generateWorkoutPlan(profile),   [profile]);
  const nutritionPlan = useMemo(() => generateNutritionPlan(profile), [profile]);

  /* ── Workout helpers ── */
  function toggleDay(day) {
    setExpanded(e => e === day ? null : day);
  }

  /* ── Nutrition helpers ── */
  function prev(type, len) {
    setMealIdx(idx => ({ ...idx, [type]: (idx[type] - 1 + len) % len }));
  }
  function next(type, len) {
    setMealIdx(idx => ({ ...idx, [type]: (idx[type] + 1) % len }));
  }

  function logMeal(mealType, option) {
    if (!user) return;
    db.food_logs.insert({
      user_id:   user.id,
      logged_at: format(new Date(), 'yyyy-MM-dd'),
      meal_type: mealType,
      food_name: option.name,
      calories:  option.calories,
      protein_g: Math.round(option.calories * 0.25 / 4),
      carbs_g:   Math.round(option.calories * 0.45 / 4),
      fat_g:     Math.round(option.calories * 0.30 / 9),
      quantity:  1,
      unit:      'serving',
      notes:     'From nutrition plan',
    });
    setLoggedMeals(s => new Set([...s, mealType]));
    setToast({ msg: `${option.name} logged! ✅`, type: 'success' });
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

      {/* ── Tabs ── */}
      <div className="plan-tab-row">
        <button className={`plan-tab${tab === 'workout'   ? ' active' : ''}`} onClick={() => setTab('workout')}>
          <Zap size={14} style={{ display: 'inline', marginRight: 5 }} />Workout
        </button>
        <button className={`plan-tab${tab === 'nutrition' ? ' active' : ''}`} onClick={() => setTab('nutrition')}>
          <Utensils size={14} style={{ display: 'inline', marginRight: 5 }} />Nutrition
        </button>
      </div>

      {/* ════════════════ WORKOUT ════════════════ */}
      {tab === 'workout' && (
        <>
          {/* Stats strip */}
          <div style={{ padding: '0 20px', marginBottom: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px', display: 'flex', gap: 16 }}>
              {[
                { label: 'Days/Week', value: profile?.training_days || 3,                   color: 'var(--fire)' },
                { label: 'Level',     value: profile?.fitness_level  || 'Beginner',          color: 'var(--elec)' },
                { label: 'Location',  value: profile?.workout_location || 'Home',            color: 'var(--neon)' },
              ].map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <div style={{ width: 1, background: 'var(--border)' }} />}
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: item.color, textTransform: 'capitalize' }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {workoutPlan.map(day => (
            <div key={day.day} className={`day-card${day.day === TODAY ? ' today' : ''}`}>
              <div className="day-card-header" onClick={() => !day.rest && toggleDay(day.day)}>
                <div style={{ flex: 1 }}>
                  <div className={`day-name${day.day === TODAY ? ' today' : ''}`}>
                    {day.day}{day.day === TODAY ? ' · Today' : ''}
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

      {/* ════════════════ NUTRITION ════════════════ */}
      {tab === 'nutrition' && (
        <>
          {/* Calorie goal strip */}
          <div style={{ padding: '0 20px', marginBottom: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--fire)' }}>
                  {profile?.daily_calorie_goal || 2000}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>kcal goal</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, flex: 1 }}>
                Swipe options for each meal and tap <strong style={{ color: 'var(--text)' }}>Log</strong> to add to your diary.
                Based on your <strong style={{ color: 'var(--text)' }}>{profile?.diet_type?.replace('_', ' ') || 'standard'}</strong> preference.
              </div>
            </div>
          </div>

          {nutritionPlan.map(({ type, options }) => {
            const idx     = mealIdx[type] || 0;
            const current = options[idx];
            const isLogged = loggedMeals.has(type);

            return (
              <div key={type} style={{ margin: '0 20px 12px' }}>
                {/* Meal header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 16 }}>{MEAL_ICONS[type]}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: isLogged ? 'var(--neon)' : 'var(--text-2)' }}>
                      {type}
                    </span>
                    {isLogged && <span style={{ fontSize: 11, color: 'var(--neon)', fontWeight: 700 }}>✓ Logged</span>}
                  </div>
                  {/* Option dots */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {options.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: i === idx ? 14 : 6,
                          height: 6,
                          borderRadius: 3,
                          background: i === idx ? 'var(--fire)' : 'var(--border-hi)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                        }}
                        onClick={() => setMealIdx(m => ({ ...m, [type]: i }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Card */}
                <div style={{
                  background: isLogged
                    ? 'linear-gradient(135deg, rgba(57,255,132,0.06), rgba(57,255,132,0.02))'
                    : 'var(--card)',
                  border: `1px solid ${isLogged ? 'rgba(57,255,132,0.2)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-lg)',
                  padding: '16px 18px',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    {/* Left arrow */}
                    <button
                      className="btn-icon"
                      style={{ flexShrink: 0, padding: 8, marginTop: 2 }}
                      onClick={() => prev(type, options.length)}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Meal info */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.2px' }}>
                        {current.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>
                        {current.sub}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, background: 'var(--fire-dim)', borderRadius: 20, padding: '4px 14px', border: '1px solid rgba(255,92,0,0.2)' }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--fire)' }}>{current.calories}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>kcal</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-2)' }}>
                        Option {idx + 1} of {options.length}
                      </div>
                    </div>

                    {/* Right arrow */}
                    <button
                      className="btn-icon"
                      style={{ flexShrink: 0, padding: 8, marginTop: 2 }}
                      onClick={() => next(type, options.length)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Log button */}
                  <button
                    className={`btn btn-full ${isLogged ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ marginTop: 14, fontSize: 14 }}
                    onClick={() => !isLogged && logMeal(type, current)}
                  >
                    {isLogged
                      ? <><Check size={15} /> Logged</>
                      : <><Plus size={15} /> Log This Meal</>
                    }
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ margin: '8px 20px 0', padding: '12px 16px', background: 'var(--elec-dim)', border: '1px solid rgba(0,207,255,0.12)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            💡 Tap the arrows to browse meal alternatives. Tap Log to add it to today's food diary.
          </div>
          <div style={{ height: 24 }} />
        </>
      )}
    </div>
  );
}
