import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = db.auth.getUser();
    setUser(currentUser);
    if (currentUser) {
      setProfile(db.profiles.findOne(p => p.id === currentUser.id));
    }
    setLoading(false);
  }, []);

  function signIn(email, password) {
    const { user: u, error } = db.auth.signIn(email, password);
    if (!error) {
      setUser(u);
      setProfile(db.profiles.findOne(p => p.id === u.id));
    }
    return { error };
  }

  function signUp(email, password, fullName) {
    const { user: u, error } = db.auth.signUp(email, password, fullName);
    if (!error) {
      setUser(u);
      setProfile(db.profiles.findOne(p => p.id === u.id));
    }
    return { error };
  }

  function signOut() {
    db.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  function updateProfile(updates) {
    const { data, error } = db.profiles.upsertById(user.id, updates);
    if (!error) setProfile(data);
    return { error };
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
