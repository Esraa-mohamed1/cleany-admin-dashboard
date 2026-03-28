import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

const pageTitles = {
  '/': 'Dashboard',
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
        <button className="cyber-icon-button" type="button" aria-label="Settings">
          ⚙
        </button>
        <div className="cyber-user-avatar" aria-hidden="true">
          A
        </div>
      </div>
    </header>
  );
};

export default Navbar;
