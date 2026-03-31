import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

const pageTitles = {
  '/': 'Bookings',
  '/bookings': 'Bookings',
  '/companies': 'Companies',
  '/categories': 'Categories',
  '/users': 'Users',
  '/offers': 'Offers',
  '/transactions': 'Transactions',
  '/login': 'Login',
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const [isLightTheme, setIsLightTheme] = useState(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    return savedTheme ? savedTheme === 'light' : true;
  });

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
      localStorage.setItem('dashboard-theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('dashboard-theme', 'dark');
    }
  }, [isLightTheme]);

  const toggleTheme = () => {
    setIsLightTheme((prev) => !prev);
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('admin_id');
    navigate('/login');
  };

  return (
    <header className="cyber-navbar" aria-label="Top navigation">
      <div className="cyber-navbar-left">
        <button 
          className="cyber-icon-button" 
          type="button" 
          aria-label="Open menu"
          onClick={() => document.body.classList.toggle('sidebar-open')}
        >
          ☰
        </button>
        <div>
          <p className="cyber-navbar-kicker">Control Center</p>
          <h1 className="cyber-navbar-title">{title}</h1>
        </div>
      </div>

      <div className="cyber-navbar-right">
        <button
          className="cyber-icon-button"
          type="button"
          aria-label="Toggle light and dark theme"
          onClick={toggleTheme}
          title={isLightTheme ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {isLightTheme ? '🌙' : '☀'}
        </button>
        <button 
          className="logout-button" 
          type="button" 
          aria-label="Logout" 
          onClick={handleLogout}
        >
          LOG OUT
        </button>
        <div className="cyber-user-avatar" aria-hidden="true">
          A
        </div>
      </div>
    </header>
  );
};

export default Navbar;
