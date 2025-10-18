import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Entry, UserProfile } from '../types';
import { COLLECTIONS } from '../constants';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [publicDisplayName, setPublicDisplayName] = useState(userProfile?.publicDisplayName || '');
  const [verificationUrl, setVerificationUrl] = useState(userProfile?.verificationImageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, COLLECTIONS.ENTRIES),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const entriesData = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()) as Entry));
        setEntries(entriesData);
      } catch (error) {
        console.error("Error fetching user entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
        const updateData: Partial<UserProfile> = {
            publicDisplayName,
        };

        if (verificationUrl && verificationUrl !== userProfile.verificationImageUrl) {
            updateData.verificationImageUrl = verificationUrl;
            updateData.verificationStatus = 'pending';
        }

        const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
        await updateDoc(userDocRef, updateData);

        await refreshUserProfile();
        setMessage({ type: 'success', text: "Profile updated successfully!"});
        setIsEditing(false);

    } catch (error) {
        console.error("Error updating profile: ", error);
        setMessage({type: 'error', text: "Failed to update profile."});
    } finally {
        setIsSubmitting(false);
    }
  }

  if (loading && !userProfile) {
    return <div className="text-center mt-10">Loading profile...</div>;
  }

  if (!user || !userProfile) {
    return <div className="text-center mt-10">Could not load user profile.</div>;
  }
  
  const statusColors: { [key in Entry['status']]: string } = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  };
  
  const verificationStatusUI = {
      unverified: { text: 'Not Verified', color: 'bg-slate-500' },
      pending: { text: 'Pending Approval', color: 'bg-yellow-500' },
      approved: { text: 'Approved', color: 'bg-green-500' },
      rejected: { text: 'Rejected', color: 'bg-red-500' },
  };
  const currentVerification = userProfile.verificationStatus ? verificationStatusUI[userProfile.verificationStatus] : verificationStatusUI.unverified;


  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
            <img src={userProfile.photoURL || ''} alt="profile" className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold text-center sm:text-left">{userProfile.publicDisplayName || userProfile.displayName}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-center sm:text-left">{userProfile.email}</p>
              <div className="text-center sm:text-left">
                <span className={`mt-2 inline-block px-3 py-1 text-xs font-semibold text-white ${currentVerification.color} rounded-full uppercase tracking-wider`}>
                  {currentVerification.text}
                </span>
              </div>
            </div>
        </div>
        {!isEditing ? (
             <button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all">Edit Profile</button>
        ) : (
            <form onSubmit={handleProfileUpdate} className="space-y-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Public Display Name</label>
                    <input type="text" value={publicDisplayName} onChange={e => setPublicDisplayName(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 p-3 rounded-md border-2 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" required />
                </div>
                {(userProfile.verificationStatus === 'unverified' || userProfile.verificationStatus === 'rejected') && (
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                          {userProfile.verificationStatus === 'rejected' ? 'Re-submit In-Game Profile Image URL' : 'In-Game Profile Image URL'}
                        </label>
                        <input 
                            type="url" 
                            value={verificationUrl} 
                            onChange={e => setVerificationUrl(e.target.value)} 
                            className="w-full bg-slate-200 dark:bg-slate-700 p-3 rounded-md border-2 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="https://imgur.com/your-image-link"
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload a screenshot of your in-game profile to a site like Imgur and paste the direct link here.</p>
                        {userProfile.verificationStatus === 'rejected' && <p className="text-xs text-red-500 dark:text-red-400 mt-1">Your previous submission was rejected. Please provide a new image link.</p>}
                    </div>
                )}
                {message && <p className={`text-center text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{message.text}</p>}
                <div className="flex space-x-2">
                    <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-2 px-4 rounded-lg disabled:from-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed transition-all">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-500 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-all">Cancel</button>
                </div>
            </form>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold mb-6">My Giveaway Entries</h2>
        {loading ? <p>Loading entries...</p> : entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <Link to={`/giveaway/${entry.giveawayId}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Giveaway Details</Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Entered on: {entry.timestamp.toDate().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {entry.multiplier > 1 && <span className="text-xs font-bold text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full bg-yellow-200 dark:bg-yellow-900/50">x{entry.multiplier}</span>}
                  <span className={`px-3 py-1 text-xs font-semibold text-white ${statusColors[entry.status]} rounded-full uppercase tracking-wider`}>
                    {entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-5">You haven't entered any giveaways yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;