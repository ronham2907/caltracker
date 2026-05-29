import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Bell, Trash2 } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { requestPermission, scheduleReminder, cancelReminder, beep } from '../lib/notifications';
import Toast from '../components/Toast';

const DAYS = [
  { label: 'M', value: 1, full: 'Mon' },
  { label: 'T', value: 2, full: 'Tue' },
  { label: 'W', value: 3, full: 'Wed' },
  { label: 'T', value: 4, full: 'Thu' },
  { label: 'F', value: 5, full: 'Fri' },
  { label: 'S', value: 6, full: 'Sat' },
  { label: 'S', value: 7, full: 'Sun' },
];

const SOUND_OPTIONS = [
  { value: 'default', label: '🔔 Ping' },
  { value: 'alert',   label: '📣 Alert' },
  { value: 'workout', label: '⚡ Workout' },
  { value: 'success', label: '✅ Success' },
];

const EMPTY_FORM = {
  title: '', message: '', reminder_time: '08:00',
  days_of_week: [1, 2, 3, 4, 5, 6, 7],
  sound: 'alert',
};

function formatTime(time24) {
  if (!time24) return { time: '--:--', ampm: '' };
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return { time: `${h12}:${String(m).padStart(2, '0')}`, ampm };
}

function dayList(days) {
  if (!days || days.length === 7) return 'Every day';
  if (days.length === 0) return 'No days';
  return days.map(d => DAYS.find(x => x.value === d)?.full).filter(Boolean).join(', ');
}

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  const fetchReminders = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const data = db.reminders
      .filter(r => r.user_id === user.id)
      .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
    setReminders(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  async function handleEnableNotifications() {
    const perm = await requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      beep('success');
      setToast({ msg: 'Notifications enabled! 🔔', type: 'success' });
    }
  }

  function toggleDay(day) {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter(d => d !== day)
        : [...f.days_of_week, day].sort((a, b) => a - b),
    }));
  }

  function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = db.reminders.insert({
      user_id:       user.id,
      title:         form.title,
      message:       form.message,
      reminder_time: form.reminder_time,
      days_of_week:  form.days_of_week,
      sound:         form.sound,
      active:        true,
    });
    setSaving(false);
    if (!error) {
      scheduleReminder(data);
      setModal(false);
      setForm(EMPTY_FORM);
      fetchReminders();
      beep('success');
      setToast({ msg: 'Reminder set! 🔔', type: 'success' });
    } else {
      setToast({ msg: error.message, type: 'error' });
    }
  }

  function toggleActive(reminder) {
    const { data } = db.reminders.update(reminder.id, { active: !reminder.active });
    if (data) {
      if (data.active) {
        scheduleReminder(data);
        beep('default');
      } else {
        cancelReminder(reminder.id);
      }
      setReminders(rs => rs.map(r => r.id === reminder.id ? data : r));
    }
  }

  function handleDelete(id) {
    cancelReminder(id);
    db.reminders.delete(id);
    setReminders(rs => rs.filter(r => r.id !== id));
    setToast({ msg: 'Reminder deleted', type: 'default' });
  }

  function previewSound(sound) {
    beep(sound);
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Reminders</div>
          <div className="page-subtitle">{reminders.filter(r => r.active).length} active</div>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14 }} onClick={() => setModal(true)}>
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Notification permission banner */}
      {notifPermission !== 'granted' && (
        <div style={{ margin: '0 20px 16px', background: 'var(--warn-dim)', border: '1px solid rgba(255,204,0,0.2)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🔔 Enable sound & notifications</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>
            Allow notifications so reminders can reach you with sound and vibration, even when the app isn't focused.
          </div>
          <button className="btn btn-primary" style={{ fontSize: 13, padding: '9px 18px' }} onClick={handleEnableNotifications}>
            Enable Notifications + Sound
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={28} /></div>
          <h3>No reminders yet</h3>
          <p>Add a reminder to stay on track — meals, workouts, water, or anything you need.</p>
        </div>
      ) : (
        reminders.map(r => {
          const { time, ampm } = formatTime(r.reminder_time);
          return (
            <div key={r.id} className="reminder-item" style={{ opacity: r.active ? 1 : 0.5 }}>
              <div className="reminder-time-wrap">
                <div className="reminder-time">{time}</div>
                <div className="reminder-ampm">{ampm}</div>
              </div>
              <div className="reminder-info">
                <div className="reminder-title">{r.title}</div>
                <div className="reminder-days">{dayList(r.days_of_week)}{r.sound ? ` · ${SOUND_OPTIONS.find(s => s.value === r.sound)?.label || ''}` : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label className="toggle">
                  <input type="checkbox" checked={r.active} onChange={() => toggleActive(r)} />
                  <span className="toggle-track" />
                </label>
                <button className="delete-btn" onClick={() => handleDelete(r.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Add modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">New Reminder</div>
            <form className="modal-form" onSubmit={handleAdd}>
              <div className="input-group">
                <label className="input-label">Title *</label>
                <input
                  className="input"
                  placeholder="e.g. Log breakfast"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Message (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Don't forget to log your meal!"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Time</label>
                <input
                  className="input"
                  type="time"
                  value={form.reminder_time}
                  onChange={e => setForm(f => ({ ...f, reminder_time: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Sound</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SOUND_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      className={'chip' + (form.sound === s.value ? ' active' : '')}
                      onClick={() => { setForm(f => ({ ...f, sound: s.value })); previewSound(s.value); }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Days</label>
                <div className="chip-row">
                  {DAYS.map(d => (
                    <span
                      key={d.value}
                      className={'chip' + (form.days_of_week.includes(d.value) ? ' active' : '')}
                      onClick={() => toggleDay(d.value)}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Saving…' : '🔔 Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
