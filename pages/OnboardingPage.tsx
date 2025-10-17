import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { COLLECTIONS } from '../constants';

const OnboardingPage: React.FC = () => {
    const { user } = useAuth();
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
            // Update user profile with the provided URL
            const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
            await updateDoc(userDocRef, {
                publicDisplayName,
                verificationImageUrl: verificationUrl,
                verificationStatus: 'pending',
            });

            // Redirect to home page
            navigate('/');

        } catch (err) {
            console.error(err);
            setError("Failed to complete setup. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <div>
                    <h2 className="text-3xl font-extrabold text-center text-white">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Just a couple more steps to get started!
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">Public Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            value={publicDisplayName}
                            onChange={(e) => setPublicDisplayName(e.target.value)}
                            placeholder="e.g., CoolCreatorFan"
                            required
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                         <p className="mt-1 text-xs text-gray-500">This will be shown on winner announcements.</p>
                    </div>
                    <div>
                        <label htmlFor="verification" className="block text-sm font-medium text-gray-300 mb-2">Verification Image URL</label>
                        <input
                            type="url"
                            id="verification"
                            value={verificationUrl}
                            onChange={(e) => setVerificationUrl(e.target.value)}
                            placeholder="https://imgur.com/your-image-link"
                            required
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                         <p className="mt-1 text-xs text-gray-500">Upload proof of engagement (e.g., subscription screenshot) to a site like Imgur and paste the direct link here.</p>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;