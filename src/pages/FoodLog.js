import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = {
  breakfast: '🌅 Breakfast',
  lunch:     '☀️ Lunch',
  dinner:    '🌙 Dinner',
  snack:     '🍎 Snack',
};

const EMPTY_FORM = {
  food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '',
  quantity: '1', unit: 'serving', meal_type: 'breakfast', notes: '',
};

export default function FoodLog() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const dateStr = format(date, 'yyyy-MM-dd');

  const fetchLogs = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const data = db.food_logs
      .filter(l => l.user_id === user.id && l.logged_at === dateStr)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    setLogs(data);
    setLoading(false);
  }, [user, dateStr]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = db.food_logs.insert({
      user_id:   user.id,
      logged_at: dateStr,
      meal_type: form.meal_type,
      food_name: form.food_name,
      calories:  parseInt(form.calories, 10),
      protein_g: parseFloat(form.protein_g) || 0,
      carbs_g:   parseFloat(form.carbs_g)   || 0,
      fat_g:     parseFloat(form.fat_g)     || 0,
      quantity:  parseFloat(form.quantity)  || 1,
      unit:      form.unit,
      notes:     form.notes,
    });
    setSaving(false);
    if (!error) {
      setModal(null);
      setForm(EMPTY_FORM);
      fetchLogs();
      setToast({ msg: 'Food logged!', type: 'success' });
    } else {
      setToast({ msg: error.message, type: 'error' });
    }
  }

  function handleDelete(id) {
    db.food_logs.delete(id);
    setLogs(l => l.filter(x => x.id !== id));
    setToast({ msg: 'Removed', type: 'default' });
  }

  const totalCals = logs.reduce((s, l) => s + (l.calories || 0), 0);
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Food Log</div>
          <div className="page-subtitle">{totalCals} kcal today</div>
        </div>
        <button
          className="btn btn-primary"
          style={{ padding: '10px 16px', fontSize: 14 }}
          onClick={() => setModal('add')}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Date navigation */}
      <div className="date-nav">
        <button className="btn-icon" onClick={() => setDate(d => subDays(d, 1))}>
          <ChevronLeft size={20} />
        </button>
        <div className="date-nav-label">
          {isToday ? 'Today' : format(date, 'EEE, MMM d')}
        </div>
        <button className="btn-icon" onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}>
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : (
        MEALS.map(meal => {
          const mealLogs = logs.filter(l => l.meal_type === meal);
          const mealCals = mealLogs.reduce((s, l) => s + (l.calories || 0), 0);
          return (
            <div key={meal} className="meal-section">
              <div className="meal-header">
                <div className="meal-title">{MEAL_LABELS[meal]}</div>
                {mealCals > 0 && <div className="meal-cals">{mealCals} kcal</div>}
              </div>

              {mealLogs.map(log => (
                <div key={log.id} className="food-item">
                  <div className="food-item-left">
                    <div className="food-item-name">{log.food_name}</div>
                    <div className="food-item-meta">{log.quantity} {log.unit}</div>
                  </div>
                  <div className="food-item-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div className="food-item-cals">{log.calories}</div>
                      <div className="food-item-macros">
                        P{Math.round(log.protein_g)}·C{Math.round(log.carbs_g)}·F{Math.round(log.fat_g)}
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => handleDelete(log.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                className="meal-add-btn"
                onClick={() => { setForm(f => ({ ...f, meal_type: meal })); setModal('add'); }}
              >
                <Plus size={14} /> Add {meal}
              </button>
            </div>
          );
        })
      )}

      {/* Add food modal */}
      {modal === 'add' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Log Food</div>
            <form className="modal-form" onSubmit={handleAdd}>
              <div className="input-group">
                <label className="input-label">Food Name *</label>
                <input className="input" placeholder="e.g. Grilled Chicken Breast" value={form.food_name} onChange={set('food_name')} required />
              </div>

              <div className="input-group">
                <label className="input-label">Meal</label>
                <select className="input" value={form.meal_type} onChange={set('meal_type')}>
                  {MEALS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Quantity</label>
                  <input className="input" type="number" step="0.1" min="0" value={form.quantity} onChange={set('quantity')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Unit</label>
                  <select className="input" value={form.unit} onChange={set('unit')}>
                    <option>serving</option>
                    <option>g</option>
                    <option>oz</option>
                    <option>ml</option>
                    <option>cup</option>
                    <option>tbsp</option>
                    <option>piece</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Calories *</label>
                <input className="input" type="number" min="0" placeholder="0" value={form.calories} onChange={set('calories')} required />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Protein (g)</label>
                  <input className="input" type="number" step="0.1" min="0" placeholder="0" value={form.protein_g} onChange={set('protein_g')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Carbs (g)</label>
                  <input className="input" type="number" step="0.1" min="0" placeholder="0" value={form.carbs_g} onChange={set('carbs_g')} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Fat (g)</label>
                <input className="input" type="number" step="0.1" min="0" placeholder="0" value={form.fat_g} onChange={set('fat_g')} />
              </div>

              <div className="input-group">
                <label className="input-label">Notes (optional)</label>
                <input className="input" placeholder="Any notes…" value={form.notes} onChange={set('notes')} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Saving…' : 'Log Food'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
