import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import Camera from './pages/Camera';
import Workouts from './pages/Workouts';
import Plan from './pages/Plan';
import Goals from './pages/Goals';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';
import Challenges from './pages/Challenges';
import BottomNav from './components/BottomNav';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading, onboardingDone } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!onboardingDone) return <Navigate to="/onboarding" replace />;
  return (
    <div className="app-layout">
      <div className="page">{children}</div>
      <BottomNav />
    </div>
  );
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function OnboardingRoute({ children }) {
  const { user, loading, onboardingDone } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (onboardingDone) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"            element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"       element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register"    element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/onboarding"  element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/log"         element={<ProtectedRoute><FoodLog /></ProtectedRoute>} />
      <Route path="/camera"      element={<ProtectedRoute><Camera /></ProtectedRoute>} />
      <Route path="/workouts"    element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
      <Route path="/plan"        element={<ProtectedRoute><Plan /></ProtectedRoute>} />
      <Route path="/goals"       element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/reminders"   element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
      <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/challenges"  element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
