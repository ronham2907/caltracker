import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Camera, Trophy, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <LayoutDashboard size={22} />
        Home
      </NavLink>

      <NavLink to="/plan" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <Dumbbell size={22} />
        Plan
      </NavLink>

      <div className="nav-item nav-cam">
        <button className="nav-cam-btn" onClick={() => navigate('/camera')} aria-label="AI Camera">
          <Camera size={22} />
        </button>
      </div>

      <NavLink to="/challenges" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <Trophy size={22} />
        Compete
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <User size={22} />
        Profile
      </NavLink>
    </nav>
  );
}
