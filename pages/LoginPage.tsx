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
       <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')"}}></div>
       <div className="absolute inset-0 bg-slate-900 bg-opacity-70"></div>

      <div className="relative w-full max-w-md p-8 space-y-8 bg-white/20 dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl text-center border border-white/20">
        <div>
           <h1 className="text-5xl font-extrabold text-gradient">
            Shadow's Fate Hub
          </h1>
          <p className="mt-4 text-lg text-slate-200 dark:text-slate-300">
            Your central place for exclusive community giveaways.
          </p>
        </div>
        
        {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-md text-sm">
                {error}
            </div>
        )}

        <div className="pt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-slate-500 disabled:to-slate-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
          >
             <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.956 0 8.522-3.469 8.522-8.755 0-.762-.085-1.43-.23-2.065z"></path>
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