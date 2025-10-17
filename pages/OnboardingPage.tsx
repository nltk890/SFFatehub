
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../services/firebase';
import { COLLECTIONS } from '../constants';

const OnboardingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [publicDisplayName, setPublicDisplayName] = useState('');
    const [verificationFile, setVerificationFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVerificationFile(e.target.files[0]);
        }
    };

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
        if (!verificationFile) {
            setError("Verification image is required.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // 1. Upload verification image
            const storageRef = ref(storage, `verifications/${user.uid}/${verificationFile.name}`);
            const snapshot = await uploadBytes(storageRef, verificationFile);
            const verificationImageUrl = await getDownloadURL(snapshot.ref);

            // 2. Update user profile
            const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
            await updateDoc(userDocRef, {
                publicDisplayName,
                verificationImageUrl,
                verificationStatus: 'pending',
            });

            // 3. Redirect to home page
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
                        <label htmlFor="verification" className="block text-sm font-medium text-gray-300 mb-2">Upload Verification Image</label>
                        <input
                            type="file"
                            id="verification"
                            onChange={handleFileChange}
                            accept="image/*"
                            required
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                        />
                         <p className="mt-1 text-xs text-gray-500">Upload proof of engagement (e.g., subscription screenshot).</p>
                        {verificationFile && <p className="text-xs mt-2 text-gray-400">Selected: {verificationFile.name}</p>}
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
