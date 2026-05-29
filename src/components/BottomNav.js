import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Camera, Dumbbell, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-item-icon"><LayoutDashboard size={22} /></span>
        Home
      </NavLink>

      <NavLink to="/log" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-item-icon"><UtensilsCrossed size={22} /></span>
        Log
      </NavLink>

      <div className="nav-item nav-cam">
        <button className="nav-cam-btn" onClick={() => navigate('/camera')} aria-label="AI Camera">
          <Camera size={22} />
        </button>
      </div>

      <NavLink to="/workouts" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-item-icon"><Dumbbell size={22} /></span>
        Workout
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-item-icon"><User size={22} /></span>
        Profile
      </NavLink>
    </nav>
  );
}
