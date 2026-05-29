import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/db';
import { scheduleAllReminders } from '../lib/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = db.auth.getUser();
    setUser(currentUser);
    if (currentUser) {
      const p = db.profiles.findOne(x => x.id === currentUser.id);
      setProfile(p);
      // Schedule any saved reminders
      const reminders = db.reminders.filter(r => r.user_id === currentUser.id && r.active);
      scheduleAllReminders(reminders);
    }
    setLoading(false);
  }, []);

  function signIn(email, password) {
    const { user: u, error } = db.auth.signIn(email, password);
    if (!error) {
      setUser(u);
      const p = db.profiles.findOne(x => x.id === u.id);
      setProfile(p);
      const reminders = db.reminders.filter(r => r.user_id === u.id && r.active);
      scheduleAllReminders(reminders);
    }
    return { error };
  }

  function signUp(email, password, fullName) {
    const { user: u, error } = db.auth.signUp(email, password, fullName);
    if (!error) {
      setUser(u);
      const p = db.profiles.findOne(x => x.id === u.id);
      setProfile(p);
    }
    return { error };
  }

  function signOut() {
    db.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  function updateProfile(updates) {
    if (!user) return { error: { message: 'Not logged in' } };
    const { data, error } = db.profiles.upsertById(user.id, updates);
    if (!error) setProfile(data);
    return { error };
  }

  const onboardingDone = !!profile?.onboarding_done;

  return (
    <AuthContext.Provider value={{ user, profile, loading, onboardingDone, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
