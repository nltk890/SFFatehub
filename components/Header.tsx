import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { ADMIN_UID } from '../constants';
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              Shadow's Fate Hub
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                {user.uid === ADMIN_UID && <NavLink to="/admin">Admin</NavLink>}
              </>
            )}
            <div className="flex items-center space-x-4">
              <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">
                {theme === 'light' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
              </button>
              {user ? (
                <div className="flex items-center space-x-3">
                  <img src={userProfile?.photoURL || ''} alt="profile" className="w-8 h-8 rounded-full" />
                  <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-indigo-500 hover:text-white dark:hover:text-white transition-colors">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <Link to={to} className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
        {children}
    </Link>
);

export default Header;
