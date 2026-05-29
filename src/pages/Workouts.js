import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { Plus, Dumbbell, ChevronLeft, ChevronRight, Trash2, Flame, Clock } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const WORKOUT_TYPES = [
  { value: 'running',        label: 'Running',        emoji: '🏃' },
  { value: 'cycling',        label: 'Cycling',        emoji: '🚴' },
  { value: 'swimming',       label: 'Swimming',       emoji: '🏊' },
  { value: 'weight_training',label: 'Weight Training',emoji: '🏋️' },
  { value: 'yoga',           label: 'Yoga',           emoji: '🧘' },
  { value: 'hiit',           label: 'HIIT',           emoji: '⚡' },
  { value: 'walking',        label: 'Walking',        emoji: '🚶' },
  { value: 'sports',         label: 'Sports',         emoji: '⚽' },
  { value: 'other',          label: 'Other',          emoji: '💪' },
];

const INTENSITY_COLORS = { low: 'var(--blue)',    medium: 'var(--yellow)',     high: 'var(--primary)' };
const INTENSITY_BG     = { low: 'var(--blue-dim)',medium: 'var(--yellow-dim)', high: 'var(--primary-dim)' };

const EMPTY_FORM = {
  workout_name: '', workout_type: 'weight_training',
  duration_minutes: '', calories_burned: '',
  intensity: 'medium', notes: '',
};

function WorkoutEmoji({ type }) {
  const w = WORKOUT_TYPES.find(x => x.value === type);
  return <span style={{ fontSize: 22 }}>{w ? w.emoji : '💪'}</span>;
}

export default function Workouts() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const dateStr = format(date, 'yyyy-MM-dd');
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  const fetchWorkouts = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const data = db.workout_logs
      .filter(w => w.user_id === user.id && w.logged_at === dateStr)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setWorkouts(data);
    setLoading(false);
  }, [user, dateStr]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = db.workout_logs.insert({
      user_id:          user.id,
      logged_at:        dateStr,
      workout_name:     form.workout_name,
      workout_type:     form.workout_type,
      duration_minutes: parseInt(form.duration_minutes, 10),
      calories_burned:  form.calories_burned ? parseInt(form.calories_burned, 10) : null,
      intensity:        form.intensity,
      notes:            form.notes,
    });
    setSaving(false);
    if (!error) {
      setModal(false);
      setForm(EMPTY_FORM);
      fetchWorkouts();
      setToast({ msg: 'Workout logged!', type: 'success' });
    } else {
      setToast({ msg: error.message, type: 'error' });
    }
  }

  function handleDelete(id) {
    db.workout_logs.delete(id);
    setWorkouts(w => w.filter(x => x.id !== id));
    setToast({ msg: 'Removed', type: 'default' });
  }

  const totalBurned  = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const totalMinutes = workouts.reduce((s, w) => s + (w.duration_minutes || 0), 0);

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Workouts</div>
          <div className="page-subtitle">
            {workouts.length} session{workouts.length !== 1 ? 's' : ''} · {totalBurned} kcal burned
          </div>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => setModal(true)}>
          <Plus size={16} /> Log
        </button>
      </div>

      <div className="date-nav">
        <button className="btn-icon" onClick={() => setDate(d => subDays(d, 1))}>
          <ChevronLeft size={20} />
        </button>
        <div className="date-nav-label">{isToday ? 'Today' : format(date, 'EEE, MMM d')}</div>
        <button className="btn-icon" onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}>
          <ChevronRight size={20} />
        </button>
      </div>

      {workouts.length > 0 && (
        <div className="stat-row" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-dim)' }}>
              <Flame size={18} color="var(--primary)" />
            </div>
            <div className="stat-value">{totalBurned}</div>
            <div className="stat-label">Calories Burned</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--blue-dim)' }}>
              <Clock size={18} color="var(--blue)" />
            </div>
            <div className="stat-value">{totalMinutes}</div>
            <div className="stat-label">Minutes Active</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Dumbbell size={28} /></div>
          <h3>No workouts logged</h3>
          <p>Tap the Log button to record a workout session.</p>
        </div>
      ) : (
        workouts.map(w => (
          <div key={w.id} className="workout-item">
            <div className="workout-icon-wrap" style={{ background: INTENSITY_BG[w.intensity] || 'var(--border)' }}>
              <WorkoutEmoji type={w.workout_type} />
            </div>
            <div className="workout-info">
              <div className="workout-name">{w.workout_name}</div>
              <div className="workout-meta">
                {w.duration_minutes} min ·{' '}
                <span style={{ color: INTENSITY_COLORS[w.intensity], fontWeight: 600 }}>{w.intensity}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="workout-cals">
                {w.calories_burned && <div className="workout-cals-value">{w.calories_burned}</div>}
                {w.calories_burned && <div className="workout-cals-label">kcal</div>}
              </div>
              <button className="delete-btn" onClick={() => handleDelete(w.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}

      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Log Workout</div>
            <form className="modal-form" onSubmit={handleAdd}>
              <div className="input-group">
                <label className="input-label">Workout Name *</label>
                <input className="input" placeholder="e.g. Morning Run" value={form.workout_name} onChange={set('workout_name')} required />
              </div>

              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input" value={form.workout_type} onChange={set('workout_type')}>
                  {WORKOUT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Duration (min) *</label>
                  <input className="input" type="number" min="1" placeholder="30" value={form.duration_minutes} onChange={set('duration_minutes')} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Calories Burned</label>
                  <input className="input" type="number" min="0" placeholder="Optional" value={form.calories_burned} onChange={set('calories_burned')} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Intensity</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['low', 'medium', 'high'].map(i => (
                    <button
                      key={i} type="button"
                      className={'goal-type-btn' + (form.intensity === i ? ' active' : '')}
                      style={{ flex: 1 }}
                      onClick={() => setForm(f => ({ ...f, intensity: i }))}
                    >
                      {i.charAt(0).toUpperCase() + i.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Notes</label>
                <input className="input" placeholder="How did it go?" value={form.notes} onChange={set('notes')} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Saving…' : 'Log Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
