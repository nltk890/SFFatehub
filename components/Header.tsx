import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../services/firebase';
import { ADMIN_UID, COLLECTIONS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Notification } from '../types';

const Header: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
      await updateDoc(notifRef, { read: true });
    }
    setIsNotificationsOpen(false);
    navigate(notification.link);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gradient">
              Shadow's Fate Hub
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                {user.uid === ADMIN_UID && <NavLink to="/admin">Admin</NavLink>}
              </>
            )}
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none">
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            {user && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-label={`View notifications. ${unreadCount} unread.`}
                  className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none relative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                    <div className="p-3 font-bold border-b border-slate-200 dark:border-slate-700">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                          <p className="text-sm">{n.message}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.timestamp.toDate().toLocaleString()}</p>
                        </div>
                      )) : <p className="p-4 text-sm text-center text-slate-500">No new notifications.</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
            {user ? (
              <div className="flex items-center space-x-3">
                <img src={userProfile?.photoURL || ''} alt="profile" className="w-9 h-9 rounded-full border-2 border-indigo-500" />
                <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-md hover:from-red-600 hover:to-orange-600 transition-all shadow-md">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                Login
              </Link>
            )}
          </nav>

          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-label={`View notifications. ${unreadCount} unread.`}
                  className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none relative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-1/2 translate-x-1/2 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                    <div className="p-3 font-bold border-b border-slate-200 dark:border-slate-700">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                          <p className="text-sm">{n.message}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.timestamp.toDate().toLocaleString()}</p>
                        </div>
                      )) : <p className="p-4 text-sm text-center text-slate-500">No new notifications.</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none">
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-slate-100 dark:bg-slate-800 absolute w-full shadow-lg">
          <nav className="flex flex-col items-center p-4 space-y-2">
            {user ? (
              <>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                {user.uid === ADMIN_UID && <NavLink to="/admin">Admin</NavLink>}
                <div className="flex items-center space-x-4 pt-2">
                  <img src={userProfile?.photoURL || ''} alt="profile" className="w-9 h-9 rounded-full border-2 border-indigo-500" />
                  <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-md hover:from-red-600 hover:to-orange-600 transition-all shadow-md">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors">
    {children}
  </Link>
);

export default Header;