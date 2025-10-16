
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { ADMIN_UID } from '../constants';

const Header: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Giveaway Hub
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
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-3">
                  <img src={userProfile?.photoURL || ''} alt="profile" className="w-8 h-8 rounded-full" />
                  <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-indigo-500 hover:text-white transition-colors">
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
    <Link to={to} className="px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors">
        {children}
    </Link>
);

export default Header;
