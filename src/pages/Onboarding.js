import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const STEPS = [
  {
    key: 'role',
    label: 'Step 1 of 6',
    question: 'Who are you?',
    sub: 'This helps us personalise your experience.',
    type: 'single',
    options: [
      { value: 'coach',   emoji: '🏆', label: 'Coach / Trainer',   sub: 'I guide and manage clients' },
      { value: 'athlete', emoji: '💪', label: 'Athlete / Client',  sub: 'I follow a training plan' },
    ],
  },
  {
    key: 'goal_type',
    label: 'Step 2 of 6',
    question: 'What is your main goal?',
    sub: 'We\'ll build your plan around this.',
    type: 'single',
    options: [
      { value: 'lose',        emoji: '🔥', label: 'Lose Weight',         sub: 'Burn fat, get lean' },
      { value: 'gain',        emoji: '💪', label: 'Build Muscle',        sub: 'Gain strength & size' },
      { value: 'endurance',   emoji: '🏃', label: 'Improve Endurance',  sub: 'Run further, last longer' },
      { value: 'performance', emoji: '⚡', label: 'Athletic Performance',sub: 'Peak sport performance' },
      { value: 'maintain',    emoji: '⚖️', label: 'Stay Fit',           sub: 'Maintain current shape' },
      { value: 'health',      emoji: '❤️', label: 'General Health',     sub: 'Feel better every day' },
    ],
  },
  {
    key: 'fitness_level',
    label: 'Step 3 of 6',
    question: 'What\'s your fitness level?',
    sub: 'Be honest — we\'ll calibrate your plan accordingly.',
    type: 'single',
    options: [
      { value: 'beginner',     emoji: '🌱', label: 'Beginner',     sub: 'Less than 1 year of training' },
      { value: 'intermediate', emoji: '🌿', label: 'Intermediate', sub: '1–3 years of training' },
      { value: 'advanced',     emoji: '🌳', label: 'Advanced',     sub: '3+ years, strong base' },
    ],
  },
  {
    key: 'training_days',
    label: 'Step 4 of 6',
    question: 'How many days per week?',
    sub: 'Pick how many days you can commit to training.',
    type: 'days',
    options: [2, 3, 4, 5, 6],
  },
  {
    key: 'workout_location',
    label: 'Step 5 of 6',
    question: 'Where do you train?',
    sub: 'We\'ll pick exercises that fit your setup.',
    type: 'grid',
    options: [
      { value: 'gym',     emoji: '🏋️', label: 'Gym',     sub: 'Full equipment' },
      { value: 'home',    emoji: '🏠', label: 'Home',    sub: 'Minimal gear' },
      { value: 'outdoor', emoji: '🌳', label: 'Outdoors',sub: 'Park / track' },
      { value: 'mix',     emoji: '🔀', label: 'Mix',     sub: 'All of the above' },
    ],
  },
  {
    key: 'diet_type',
    label: 'Step 6 of 6',
    question: 'Any dietary preferences?',
    sub: 'We\'ll tailor your nutrition suggestions.',
    type: 'grid',
    options: [
      { value: 'none',         emoji: '🍽️', label: 'No Restrictions', sub: 'Eat everything' },
      { value: 'vegetarian',   emoji: '🥗', label: 'Vegetarian',      sub: 'No meat' },
      { value: 'vegan',        emoji: '🌱', label: 'Vegan',           sub: 'No animal products' },
      { value: 'keto',         emoji: '🥩', label: 'Keto',            sub: 'Low carb, high fat' },
      { value: 'high_protein', emoji: '💊', label: 'High Protein',    sub: 'Muscle-focused eating' },
      { value: 'gluten_free',  emoji: '🌾', label: 'Gluten Free',     sub: 'No gluten' },
    ],
  },
];

export default function Onboarding() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    role: null,
    goal_type: null,
    fitness_level: null,
    training_days: 4,
    workout_location: null,
    diet_type: null,
  });
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const totalSteps = STEPS.length;
  const selected = answers[current.key];
  const canNext = selected !== null && selected !== undefined;

  function select(value) {
    setAnswers(a => ({ ...a, [current.key]: value }));
  }

  function goNext() {
    if (step < totalSteps - 1) setStep(s => s + 1);
    else finish();
  }

  function goBack() {
    if (step > 0) setStep(s => s - 1);
  }

  async function finish() {
    setSaving(true);
    updateProfile({
      goal_type:        answers.goal_type,
      fitness_level:    answers.fitness_level,
      training_days:    answers.training_days,
      workout_location: answers.workout_location,
      diet_type:        answers.diet_type,
      role:             answers.role,
      onboarding_done:  true,
    });

    db.profiles.update(user.id, {
      goal_type:        answers.goal_type,
      fitness_level:    answers.fitness_level,
      training_days:    answers.training_days,
      workout_location: answers.workout_location,
      diet_type:        answers.diet_type,
      role:             answers.role,
      onboarding_done:  true,
    });

    setSaving(false);
    navigate('/dashboard');
  }

  return (
    <div className="onboarding-page">
      {/* Progress bar */}
      <div className="onboarding-progress">
        {STEPS.map((_, i) => (
          <div key={i} className="onboarding-prog-bar">
            <div className="onboarding-prog-bar-fill" style={{ width: i <= step ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <div className="onboarding-body">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <Logo size={28} />
          <span style={{ fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, var(--fire), var(--elec))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            FitForge
          </span>
        </div>

        <div className="onboarding-step-label">{current.label}</div>
        <div className="onboarding-question">{current.question}</div>
        <div className="onboarding-sub">{current.sub}</div>

        {/* Options */}
        {current.type === 'days' ? (
          <div>
            <div className="onboarding-day-selector">
              {current.options.map(d => (
                <button
                  key={d}
                  className={`onboarding-day-btn${answers.training_days === d ? ' selected' : ''}`}
                  onClick={() => select(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-2)' }}>
              {answers.training_days} days per week selected
            </p>
          </div>
        ) : (
          <div className={`onboarding-options${current.type === 'grid' ? ' grid' : ''}`}>
            {current.options.map(opt => (
              <div
                key={opt.value}
                className={`onboarding-option${answers[current.key] === opt.value ? ' selected' : ''}`}
                onClick={() => select(opt.value)}
              >
                <span className="onboarding-option-emoji">{opt.emoji}</span>
                <div className="onboarding-option-text">
                  <strong>{opt.label}</strong>
                  {opt.sub && <span>{opt.sub}</span>}
                </div>
                {answers[current.key] === opt.value && (
                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--fire)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="onboarding-footer">
        {step > 0 ? (
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={goBack}>
            <ChevronLeft size={18} /> Back
          </button>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={goNext}
          disabled={!canNext || saving}
        >
          {saving ? 'Setting up…' : step === totalSteps - 1 ? 'Build My Plan' : 'Continue'}
          {!saving && step < totalSteps - 1 && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
