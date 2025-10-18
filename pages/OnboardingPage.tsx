import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { COLLECTIONS } from '../constants';

const OnboardingPage: React.FC = () => {
    const { user, userProfile, refreshUserProfile } = useAuth();
    const navigate = useNavigate();
    const [publicDisplayName, setPublicDisplayName] = useState('');
    const [verificationUrl, setVerificationUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError("You are not logged in.");
            return;
        }
        if (!publicDisplayName.trim()) {
            setError("Public display name is required.");
            return;
        }
        if (!verificationUrl.trim()) {
            setError("Verification image URL is required.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
            await updateDoc(userDocRef, {
                publicDisplayName,
                verificationImageUrl: verificationUrl,
                verificationStatus: 'pending',
            });
            
            await refreshUserProfile();
            navigate('/');

        } catch (err) {
            console.error(err);
            setError("Failed to complete setup. Please try again.");
            setSubmitting(false);
        }
    };

    if (userProfile?.verificationStatus === 'pending') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg text-center">
                    <h2 className="text-3xl font-extrabold text-gradient">
                        Pending Approval
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Your profile has been submitted for verification. Please check back later. You can view your status on your profile page.
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-3xl font-extrabold text-center text-gradient">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                        Just a couple more steps to get started!
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Public Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            value={publicDisplayName}
                            onChange={(e) => setPublicDisplayName(e.target.value)}
                            placeholder="e.g., CoolCreatorFan"
                            required
                            className="w-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-md border-2 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                         <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This will be shown on winner announcements.</p>
                    </div>
                    <div>
                        <label htmlFor="verification" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">In-Game Profile Image URL</label>
                        <input
                            type="url"
                            id="verification"
                            value={verificationUrl}
                            onChange={(e) => setVerificationUrl(e.target.value)}
                            placeholder="https://imgur.com/your-image-link"
                            required
                            className="w-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-md border-2 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                         <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload a screenshot of your in-game profile to a site like Imgur and paste the direct image link here.</p>
                    </div>
                    {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all disabled:from-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;