import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import './theme.css';

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <FaSun className="theme-toggle-icon" />
      ) : (
        <FaMoon className="theme-toggle-icon" />
      )}
    </button>
  );
}

export default ThemeToggle; 