import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { UserProfile } from '../types';
import { COLLECTIONS } from '../constants';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore, if not, create a new document
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUserProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          publicDisplayName: '',
          verificationStatus: 'unverified',
          isSubscribed: false,
          isChannelMember: false,
          engagementPoints: 0,
        };
        await setDoc(userDocRef, newUserProfile, { merge: true });
      }
      
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8">
       <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')", filter: 'blur(8px)'}}></div>
       <div className="absolute inset-0 bg-gray-900 bg-opacity-60"></div>

      <div className="relative w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-80 backdrop-blur-sm rounded-xl shadow-2xl text-center">
        <div>
           <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">
            Shadow's Fate Hub
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Your central place for exclusive community giveaways.
          </p>
        </div>
        
        {error && (
            <div className="p-3 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-md text-sm">
                {error}
            </div>
        )}

        <div className="pt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500 transition-transform transform hover:scale-105"
          >
             <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.5 8a.5.5 0 01.5-.5h8a.5.5 0 010 1H6a.5.5 0 01-.5-.5zm.5 3.5a.5.5 0 000 1h4a.5.5 0 000-1h-4z" clipRule="evenodd" />
                </svg>
            </span>
             {isLoading ? 'Signing in...' : 'Login with Google to Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
