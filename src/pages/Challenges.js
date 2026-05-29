import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, Users, Zap, Copy, Check } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const CHALLENGE_TYPES = [
  { value: 'workout_streak', emoji: '🏋️', label: 'Workout Streak',    unit: 'days',     color: 'var(--fire)'   },
  { value: 'calorie_deficit',emoji: '🔥', label: 'Calorie Deficit',   unit: 'kcal',     color: 'var(--elec)'   },
  { value: 'steps',          emoji: '🚶', label: 'Step Challenge',    unit: 'steps',    color: 'var(--neon)'   },
  { value: 'pushups',        emoji: '💪', label: 'Push-Up Challenge', unit: 'push-ups', color: 'var(--purple)'  },
  { value: 'custom',         emoji: '🎯', label: 'Custom Challenge',  unit: 'points',   color: 'var(--warn)'   },
];

const EMPTY_FORM = {
  title: '', description: '',
  challenge_type: 'workout_streak',
  goal_value: '', duration_days: '30',
};

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getTypeInfo(type) {
  return CHALLENGE_TYPES.find(t => t.value === type) || CHALLENGE_TYPES[4];
}

export default function Challenges() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('mine');
  const [challenges, setChallenges] = useState([]);
  const [modal, setModal] = useState(null); // null | 'create' | 'join' | challenge object
  const [form, setForm] = useState(EMPTY_FORM);
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchChallenges = useCallback(() => {
    const all = db.challenges ? db.challenges.list() : [];
    setChallenges(all);
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const code = generateCode();
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(
      new Date(Date.now() + parseInt(form.duration_days, 10) * 86400000),
      'yyyy-MM-dd'
    );

    const challenge = {
      title:          form.title,
      description:    form.description,
      challenge_type: form.challenge_type,
      goal_value:     parseFloat(form.goal_value) || 0,
      goal_unit:      getTypeInfo(form.challenge_type).unit,
      duration_days:  parseInt(form.duration_days, 10),
      start_date:     startDate,
      end_date:       endDate,
      creator_id:     user.id,
      creator_name:   profile?.full_name || user.email,
      invite_code:    code,
      participants: [{
        user_id:    user.id,
        name:       profile?.full_name || 'You',
        progress:   0,
        joined_at:  new Date().toISOString(),
      }],
    };

    db.challenges.insert(challenge);
    setSaving(false);
    setModal(null);
    setForm(EMPTY_FORM);
    fetchChallenges();
    setToast({ msg: `Challenge created! Code: ${code}`, type: 'success' });
  }

  function handleJoin(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    const challenge = db.challenges.findOne(c => c.invite_code === code);

    if (!challenge) {
      setToast({ msg: 'Challenge not found. Check the code.', type: 'error' });
      return;
    }

    const alreadyIn = challenge.participants?.some(p => p.user_id === user.id);
    if (alreadyIn) {
      setToast({ msg: 'You\'re already in this challenge!', type: 'error' });
      return;
    }

    const updated = {
      ...challenge,
      participants: [
        ...(challenge.participants || []),
        { user_id: user.id, name: profile?.full_name || 'You', progress: 0, joined_at: new Date().toISOString() },
      ],
    };

    db.challenges.update(challenge.id, updated);
    setModal(null);
    setJoinCode('');
    fetchChallenges();
    setToast({ msg: `Joined "${challenge.title}"! 🎉`, type: 'success' });
  }

  function updateProgress(challenge, amount) {
    const updated = {
      ...challenge,
      participants: challenge.participants.map(p =>
        p.user_id === user.id ? { ...p, progress: Math.max(0, (p.progress || 0) + amount) } : p
      ),
    };
    db.challenges.update(challenge.id, updated);
    fetchChallenges();
    setModal(null);
    setToast({ msg: 'Progress updated! 💪', type: 'success' });
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const myChallenges = challenges.filter(c =>
    c.participants?.some(p => p.user_id === user?.id)
  );
  const display = tab === 'mine' ? myChallenges : challenges;

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Challenges</div>
          <div className="page-subtitle">{myChallenges.length} active challenge{myChallenges.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={() => setModal('join')} title="Join with code">
            <Users size={18} />
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '10px 16px', fontSize: 13 }}
            onClick={() => setModal('create')}
          >
            <Plus size={15} /> New
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="plan-tab-row">
        <button className={`plan-tab${tab === 'mine' ? ' active' : ''}`} onClick={() => setTab('mine')}>My Challenges</button>
        <button className={`plan-tab${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>All Challenges</button>
      </div>

      {display.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Trophy size={28} /></div>
          <h3>{tab === 'mine' ? 'No challenges yet' : 'No challenges exist'}</h3>
          <p>Create a challenge or join one with a code to compete with friends and clients.</p>
        </div>
      ) : (
        display.map(ch => {
          const typeInfo = getTypeInfo(ch.challenge_type);
          const myParticipant = ch.participants?.find(p => p.user_id === user?.id);
          const myProgress = myParticipant?.progress || 0;
          const pct = ch.goal_value ? Math.min((myProgress / ch.goal_value) * 100, 100) : 0;
          const daysLeft = ch.end_date ? Math.max(0, differenceInDays(new Date(ch.end_date), new Date())) : null;
          const isOver = daysLeft === 0;

          const sorted = [...(ch.participants || [])].sort((a, b) => (b.progress || 0) - (a.progress || 0));

          return (
            <div key={ch.id} className="challenge-card">
              <div className="challenge-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{typeInfo.emoji}</span>
                    <div className="challenge-title">{ch.title}</div>
                  </div>
                  {ch.description && <div className="challenge-desc">{ch.description}</div>}
                </div>
                <div className="challenge-badge" style={{ background: isOver ? 'rgba(80,80,106,0.3)' : typeInfo.color + '22', color: isOver ? 'var(--muted)' : typeInfo.color, border: `1px solid ${isOver ? 'var(--border-hi)' : typeInfo.color + '44'}` }}>
                  {isOver ? 'Ended' : daysLeft !== null ? `${daysLeft}d left` : 'Active'}
                </div>
              </div>

              {/* My progress */}
              {myParticipant && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>
                    YOUR PROGRESS: <span style={{ color: typeInfo.color, fontWeight: 800 }}>{myProgress} / {ch.goal_value} {ch.goal_unit}</span>
                  </div>
                  <div className="challenge-progress-track">
                    <div className="challenge-progress-fill" style={{ width: `${pct}%`, background: typeInfo.color }} />
                  </div>
                </>
              )}

              {/* Leaderboard */}
              {ch.participants?.length > 1 && (
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border)' }}>
                  {sorted.slice(0, 3).map((p, i) => (
                    <div key={p.user_id} className="leaderboard-row" style={{ background: p.user_id === user.id ? 'rgba(255,92,0,0.05)' : 'transparent' }}>
                      <div className={`leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="leaderboard-avatar">
                        {(p.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="leaderboard-name">
                        {p.name} {p.user_id === user.id && <span style={{ color: 'var(--fire)', fontSize: 11, fontWeight: 700 }}>YOU</span>}
                      </div>
                      <div className="leaderboard-score">{p.progress || 0}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="challenge-footer">
                {/* Invite code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{ch.invite_code}</span>
                  <button
                    className="btn-icon"
                    style={{ padding: '4px 8px' }}
                    onClick={() => copyCode(ch.invite_code)}
                  >
                    {copiedCode === ch.invite_code ? <Check size={12} color="var(--neon)" /> : <Copy size={12} />}
                  </button>
                </div>

                {myParticipant && !isOver && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: 12 }}
                    onClick={() => setModal(ch)}
                  >
                    <Zap size={12} /> Log Progress
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Create Challenge Modal */}
      {modal === 'create' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">New Challenge</div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="input-group">
                <label className="input-label">Challenge Name *</label>
                <input className="input" placeholder="e.g. 30-Day Shred" value={form.title} onChange={set('title')} required />
              </div>

              <div className="input-group">
                <label className="input-label">Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {CHALLENGE_TYPES.map(t => (
                    <button
                      key={t.value} type="button"
                      className={'goal-type-btn' + (form.challenge_type === t.value ? ' active' : '')}
                      onClick={() => setForm(f => ({ ...f, challenge_type: t.value }))}
                      style={{ padding: '10px 8px', fontSize: 12 }}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Goal ({getTypeInfo(form.challenge_type).unit})</label>
                  <input className="input" type="number" min="1" placeholder="30" value={form.goal_value} onChange={set('goal_value')} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Duration (days)</label>
                  <input className="input" type="number" min="1" max="365" placeholder="30" value={form.duration_days} onChange={set('duration_days')} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description (optional)</label>
                <input className="input" placeholder="What is this challenge about?" value={form.description} onChange={set('description')} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Creating…' : '🏆 Create Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Challenge Modal */}
      {modal === 'join' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Join a Challenge</div>
            <form className="modal-form" onSubmit={handleJoin}>
              <div className="invite-code-box" style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Enter the 6-character invite code</div>
                <input
                  className="input"
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 6, fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Join Challenge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Progress Modal */}
      {modal && typeof modal === 'object' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Log Progress</div>
            <div style={{ marginBottom: 20, color: 'var(--text-2)', fontSize: 14 }}>
              Add your {getTypeInfo(modal.challenge_type).unit} to <strong style={{ color: 'var(--text)' }}>{modal.title}</strong>
            </div>
            <LogProgressForm
              challenge={modal}
              user={user}
              onLog={updateProgress}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LogProgressForm({ challenge, user, onLog, onCancel }) {
  const typeInfo = getTypeInfo(challenge.challenge_type);
  const me = challenge.participants?.find(p => p.user_id === user?.id);
  const [amount, setAmount] = useState('1');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="input-group">
        <label className="input-label">Add {typeInfo.unit}</label>
        <input
          className="input"
          type="number"
          min="1"
          placeholder="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ fontSize: 28, fontWeight: 900, textAlign: 'center' }}
        />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
        Current: <strong style={{ color: 'var(--fire)' }}>{me?.progress || 0}</strong> → <strong style={{ color: 'var(--neon)' }}>{(me?.progress || 0) + (parseFloat(amount) || 0)}</strong> {typeInfo.unit}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={() => onLog(challenge, parseFloat(amount) || 0)}
        >
          <Zap size={16} /> Log It
        </button>
      </div>
    </div>
  );
}

function getTypeInfo(type) {
  return CHALLENGE_TYPES.find(t => t.value === type) || CHALLENGE_TYPES[4];
}
