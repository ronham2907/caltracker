import React, { useState, useRef } from 'react';
import { Camera as CameraIcon, Upload, Sparkles, Check, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function Camera() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      setBase64(ev.target.result.split(',')[1]);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!base64) return;
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: 'image/jpeg' }),
      });
      if (!res.ok) throw new Error('Server not running. Start it with: npm run server');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setAnalyzing(false);
  }

  function logFood() {
    if (!result || !user) return;
    setSaving(true);
    const { error } = db.food_logs.insert({
      user_id:     user.id,
      logged_at:   format(new Date(), 'yyyy-MM-dd'),
      meal_type:   mealType,
      food_name:   result.food_name,
      calories:    result.calories,
      protein_g:   result.protein_g || 0,
      carbs_g:     result.carbs_g   || 0,
      fat_g:       result.fat_g     || 0,
      quantity:    1,
      unit:        'serving',
      notes:       'AI analyzed',
      ai_analyzed: true,
    });
    setSaving(false);
    if (!error) {
      setToast({ msg: 'Logged!', type: 'success' });
      reset();
    } else {
      setToast({ msg: error.message, type: 'error' });
    }
  }

  function reset() {
    setPreview(null);
    setBase64(null);
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function openCamera() {
    if (fileRef.current) {
      fileRef.current.setAttribute('capture', 'environment');
      fileRef.current.click();
    }
  }

  function openGallery() {
    if (fileRef.current) {
      fileRef.current.removeAttribute('capture');
      fileRef.current.click();
    }
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">AI Camera</div>
          <div className="page-subtitle">Photograph your plate to estimate calories</div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {/* Image area */}
      <div className="camera-area">
        {preview ? (
          <>
            <img src={preview} alt="Food preview" className="camera-preview" />
            <button
              className="btn-icon"
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)' }}
              onClick={reset}
            >
              <RotateCcw size={18} color="white" />
            </button>
          </>
        ) : (
          <div className="camera-placeholder">
            <div className="camera-placeholder-icon">
              <CameraIcon size={34} />
            </div>
            <h3>No photo yet</h3>
            <p>Take a photo or upload one to get an instant calorie estimate from AI.</p>
          </div>
        )}
      </div>

      <div className="camera-actions">
        {error && <div className="auth-error">{error}</div>}

        {!preview && (
          <>
            <button className="btn btn-primary btn-full" onClick={openCamera}>
              <CameraIcon size={18} /> Take a Photo
            </button>
            <button className="btn btn-ghost btn-full" onClick={openGallery}>
              <Upload size={18} /> Upload from Gallery
            </button>
          </>
        )}

        {preview && !result && (
          <button className="btn btn-primary btn-full" onClick={analyze} disabled={analyzing}>
            <Sparkles size={18} />
            {analyzing ? 'Analyzing with AI…' : 'Analyze with AI'}
          </button>
        )}
      </div>

      {/* AI Result */}
      {result && (
        <div className="ai-result-card">
          <div className="ai-result-header">
            <Sparkles size={16} color="var(--primary)" />
            <span className="ai-result-label">AI Analysis</span>
          </div>
          <div className="ai-result-body">
            <div className="ai-food-name">{result.food_name}</div>

            <div className="ai-macro-grid">
              <div className="ai-macro-item">
                <div className="ai-macro-value" style={{ color: 'var(--primary)' }}>{result.calories}</div>
                <div className="ai-macro-label">kcal</div>
              </div>
              <div className="ai-macro-item">
                <div className="ai-macro-value" style={{ color: 'var(--macro-protein)' }}>{result.protein_g}g</div>
                <div className="ai-macro-label">Protein</div>
              </div>
              <div className="ai-macro-item">
                <div className="ai-macro-value" style={{ color: 'var(--macro-carbs)' }}>{result.carbs_g}g</div>
                <div className="ai-macro-label">Carbs</div>
              </div>
              <div className="ai-macro-item">
                <div className="ai-macro-value" style={{ color: 'var(--macro-fat)' }}>{result.fat_g}g</div>
                <div className="ai-macro-label">Fat</div>
              </div>
            </div>

            {result.notes && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{result.notes}</p>
            )}

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Log as meal</label>
              <select className="input" value={mealType} onChange={e => setMealType(e.target.value)}>
                {MEALS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={reset}>
                <RotateCcw size={16} /> Retake
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={logFood} disabled={saving}>
                <Check size={16} />
                {saving ? 'Logging…' : 'Log This Meal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
