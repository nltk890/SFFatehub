
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GiveawayDetailPage from './pages/GiveawayDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import { ADMIN_UID } from './constants';
import OnboardingPage from './pages/OnboardingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }
  // Redirect to onboarding if profile is not complete
  if (!userProfile?.publicDisplayName || userProfile.verificationStatus === 'unverified') {
    // Allow access to onboarding page itself from protected context
    if (window.location.hash !== '#/onboarding') {
       return <Navigate to="/onboarding" />;
    }
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
     return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }
  return user.uid === ADMIN_UID ? <>{children}</> : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
          <Header />
          <main className="container mx-auto p-4 md:p-8">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
               <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/giveaway/:id" element={<ProtectedRoute><GiveawayDetailPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
