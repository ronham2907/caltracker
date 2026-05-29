import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, Target, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const ACTIVITY_LEVELS = [
  { value: 'sedentary',  label: 'Sedentary',   sub: 'Little or no exercise' },
  { value: 'light',      label: 'Light',        sub: '1–3 days/week' },
  { value: 'moderate',   label: 'Moderate',     sub: '3–5 days/week' },
  { value: 'active',     label: 'Active',       sub: '6–7 days/week' },
  { value: 'very_active',label: 'Very Active',  sub: 'Hard exercise daily' },
];

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', age: '', weight_kg: '', height_cm: '', gender: 'male',
    goal_type: 'maintain', activity_level: 'moderate',
    goal_weight: '',
    daily_calorie_goal: '2000', daily_protein_goal: '150',
    daily_carb_goal: '250', daily_fat_goal: '65',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:          profile.full_name           || '',
        gender:             profile.gender              || 'male',
        goal_weight:        profile.goal_weight         || '',
        age:                profile.age                || '',
        weight_kg:          profile.weight_kg          || '',
        height_cm:          profile.height_cm          || '',
        goal_type:          profile.goal_type          || 'maintain',
        activity_level:     profile.activity_level     || 'moderate',
        daily_calorie_goal: profile.daily_calorie_goal || '2000',
        daily_protein_goal: profile.daily_protein_goal || '150',
        daily_carb_goal:    profile.daily_carb_goal    || '250',
        daily_fat_goal:     profile.daily_fat_goal     || '65',
      });
    }
  }, [profile]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = updateProfile({
      full_name:          form.full_name,
      gender:             form.gender,
      age:                parseInt(form.age, 10)                || null,
      weight_kg:          parseFloat(form.weight_kg)            || null,
      height_cm:          parseFloat(form.height_cm)            || null,
      goal_weight:        parseFloat(form.goal_weight)          || null,
      goal_type:          form.goal_type,
      activity_level:     form.activity_level,
      daily_calorie_goal: parseInt(form.daily_calorie_goal, 10) || 2000,
      daily_protein_goal: parseInt(form.daily_protein_goal, 10) || 150,
      daily_carb_goal:    parseInt(form.daily_carb_goal, 10)    || 250,
      daily_fat_goal:     parseInt(form.daily_fat_goal, 10)     || 65,
    });
    setSaving(false);
    if (!error) setToast({ msg: 'Profile saved!', type: 'success' });
    else setToast({ msg: error.message, type: 'error' });
  }

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const initials = (form.full_name || user?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-name">{form.full_name || 'Your Name'}</div>
        <div className="profile-email">{user?.email}</div>
      </div>

      <form onSubmit={handleSave}>
        <div className="profile-section">
          <div className="profile-section-title">Personal Info</div>
          <div className="profile-form">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" placeholder="Your name" value={form.full_name} onChange={set('full_name')} />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">Age</label>
                <input className="input" type="number" min="1" max="120" placeholder="25" value={form.age} onChange={set('age')} />
              </div>
              <div className="input-group">
                <label className="input-label">Weight (kg)</label>
                <input className="input" type="number" step="0.1" placeholder="70" value={form.weight_kg} onChange={set('weight_kg')} />
              </div>
            </div>
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">Height (cm)</label>
                <input className="input" type="number" step="0.1" placeholder="175" value={form.height_cm} onChange={set('height_cm')} />
              </div>
              <div className="input-group">
                <label className="input-label">Goal Weight (kg)</label>
                <input className="input" type="number" step="0.1" placeholder="65" value={form.goal_weight} onChange={set('goal_weight')} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Gender (for BMR)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['male', 'female'].map(g => (
                  <button
                    key={g} type="button"
                    className={'goal-type-btn' + (form.gender === g ? ' active' : '')}
                    style={{ flex: 1 }}
                    onClick={() => setForm(f => ({ ...f, gender: g }))}
                  >
                    {g === 'male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">My Goal</div>
          <div className="goal-type-grid">
            {[
              { value: 'lose',     label: 'Lose Weight', emoji: '📉' },
              { value: 'maintain', label: 'Maintain',    emoji: '⚖️' },
              { value: 'gain',     label: 'Gain Muscle', emoji: '📈' },
            ].map(g => (
              <button
                key={g.value} type="button"
                className={'goal-type-btn' + (form.goal_type === g.value ? ' active' : '')}
                onClick={() => setForm(f => ({ ...f, goal_type: g.value }))}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{g.emoji}</div>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Activity Level</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ACTIVITY_LEVELS.map(level => (
              <button
                key={level.value} type="button"
                onClick={() => setForm(f => ({ ...f, activity_level: level.value }))}
                style={{
                  background:   form.activity_level === level.value ? 'var(--primary-dim)' : 'var(--surface)',
                  border:       `1.5px solid ${form.activity_level === level.value ? 'rgba(255,107,53,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding:      '12px 16px',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'space-between',
                  cursor:       'pointer',
                  transition:   'all 0.15s',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: form.activity_level === level.value ? 'var(--primary)' : 'var(--text)' }}>
                    {level.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{level.sub}</div>
                </div>
                {form.activity_level === level.value && (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Daily Targets</div>
          <div className="profile-form">
            <div className="input-group">
              <label className="input-label">Calorie Goal (kcal)</label>
              <input className="input" type="number" min="800" max="5000" value={form.daily_calorie_goal} onChange={set('daily_calorie_goal')} />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">Protein (g)</label>
                <input className="input" type="number" min="0" value={form.daily_protein_goal} onChange={set('daily_protein_goal')} />
              </div>
              <div className="input-group">
                <label className="input-label">Carbs (g)</label>
                <input className="input" type="number" min="0" value={form.daily_carb_goal} onChange={set('daily_carb_goal')} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Fat (g)</label>
              <input className="input" type="number" min="0" value={form.daily_fat_goal} onChange={set('daily_fat_goal')} />
            </div>
          </div>
        </div>

        <div style={{ margin: '0 20px 20px' }}>
          <button
            type="button" onClick={() => navigate('/goals')}
            style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Target size={18} color="var(--primary)" />
              <span style={{ fontSize: 15, fontWeight: 500 }}>My Goals</span>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </button>
          <button
            type="button" onClick={() => navigate('/reminders')}
            style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell size={18} color="var(--purple)" />
              <span style={{ fontSize: 15, fontWeight: 500 }}>Reminders</span>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </button>
        </div>

        <div style={{ padding: '0 20px 16px' }}>
          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      <div style={{ padding: '0 20px 40px' }}>
        <button className="btn btn-danger btn-full" onClick={handleSignOut}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
