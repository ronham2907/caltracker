import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const GOAL_TYPES = [
  { value: 'weight',   label: 'Weight',          unit: 'kg',       emoji: '⚖️', color: 'var(--blue)' },
  { value: 'calories', label: 'Daily Calories',   unit: 'kcal',     emoji: '🔥', color: 'var(--primary)' },
  { value: 'workout',  label: 'Weekly Workouts',  unit: 'sessions', emoji: '💪', color: 'var(--green)' },
  { value: 'water',    label: 'Daily Water',      unit: 'L',        emoji: '💧', color: 'var(--blue)' },
  { value: 'custom',   label: 'Custom Goal',      unit: '',         emoji: '🎯', color: 'var(--purple)' },
];

const EMPTY_FORM = {
  title: '', goal_type: 'weight', target_value: '',
  current_value: '', unit: 'kg', target_date: '',
};

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchGoals = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const data = db.goals
      .filter(g => g.user_id === user.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setGoals(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  function set(field) {
    return e => {
      const val = e.target.value;
      setForm(f => {
        const updates = { ...f, [field]: val };
        if (field === 'goal_type') {
          const gt = GOAL_TYPES.find(g => g.value === val);
          updates.unit  = gt?.unit  || '';
          updates.title = gt?.label || '';
        }
        return updates;
      });
    };
  }

  function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = db.goals.insert({
      user_id:       user.id,
      title:         form.title,
      goal_type:     form.goal_type,
      target_value:  parseFloat(form.target_value)  || null,
      current_value: parseFloat(form.current_value) || 0,
      unit:          form.unit,
      target_date:   form.target_date || null,
      completed:     false,
    });
    setSaving(false);
    if (!error) {
      setModal(false);
      setForm(EMPTY_FORM);
      fetchGoals();
      setToast({ msg: 'Goal added!', type: 'success' });
    } else {
      setToast({ msg: error.message, type: 'error' });
    }
  }

  function handleDelete(id) {
    db.goals.delete(id);
    setGoals(g => g.filter(x => x.id !== id));
    setToast({ msg: 'Goal removed', type: 'default' });
  }

  function handleToggle(goal) {
    const { data } = db.goals.update(goal.id, { completed: !goal.completed });
    if (data) setGoals(gs => gs.map(g => g.id === goal.id ? data : g));
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Goals</div>
          <div className="page-subtitle">
            {goals.filter(g => !g.completed).length} active goal{goals.filter(g => !g.completed).length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => setModal(true)}>
          <Plus size={16} /> Add
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={28} /></div>
          <h3>No goals yet</h3>
          <p>Set a goal to stay motivated and track your progress.</p>
        </div>
      ) : (
        goals.map(goal => {
          const gt  = GOAL_TYPES.find(g => g.value === goal.goal_type) || GOAL_TYPES[4];
          const pct = goal.target_value
            ? Math.min((goal.current_value / goal.target_value) * 100, 100)
            : 0;

          return (
            <div key={goal.id} className="goal-item" style={{ opacity: goal.completed ? 0.6 : 1 }}>
              <div className="goal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{gt.emoji}</span>
                  <div className="goal-title" style={{ textDecoration: goal.completed ? 'line-through' : 'none' }}>
                    {goal.title}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: goal.completed ? 'var(--green)' : 'var(--muted)' }}
                    onClick={() => handleToggle(goal)}
                    title="Toggle complete"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(goal.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {goal.target_value && (
                <>
                  <div className="goal-progress-track">
                    <div className="goal-progress-fill" style={{ width: `${pct}%`, background: gt.color }} />
                  </div>
                  <div className="goal-footer">
                    <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                </>
              )}

              {goal.target_date && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                  Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          );
        })
      )}

      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Add Goal</div>
            <form className="modal-form" onSubmit={handleAdd}>
              <div className="input-group">
                <label className="input-label">Goal Type</label>
                <select className="input" value={form.goal_type} onChange={set('goal_type')}>
                  {GOAL_TYPES.map(g => (
                    <option key={g.value} value={g.value}>{g.emoji} {g.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Title *</label>
                <input className="input" placeholder="e.g. Lose 5kg" value={form.title} onChange={set('title')} required />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Current Value</label>
                  <input className="input" type="number" step="0.1" placeholder="0" value={form.current_value} onChange={set('current_value')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Target Value</label>
                  <input className="input" type="number" step="0.1" placeholder="0" value={form.target_value} onChange={set('target_value')} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Unit</label>
                <input className="input" placeholder="kg, kcal, sessions…" value={form.unit} onChange={set('unit')} />
              </div>

              <div className="input-group">
                <label className="input-label">Target Date (optional)</label>
                <input className="input" type="date" value={form.target_date} onChange={set('target_date')} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Saving…' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
