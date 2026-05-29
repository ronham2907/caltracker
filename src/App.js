import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import Camera from './pages/Camera';
import Workouts from './pages/Workouts';
import Goals from './pages/Goals';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <div className="page">{children}</div>
      <BottomNav />
    </div>
  );
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute><FoodLog /></ProtectedRoute>} />
          <Route path="/camera" element={<ProtectedRoute><Camera /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
