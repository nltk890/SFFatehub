
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Entry } from '../types';
import { COLLECTIONS } from '../constants';

const ProfilePage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

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
        // Fix: Spread types may only be created from object types. Replaced object spread with `Object.assign`.
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

  if (loading) {
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl mb-8 flex items-center space-x-6">
        <img src={userProfile.photoURL || ''} alt="profile" className="w-24 h-24 rounded-full border-4 border-indigo-500" />
        <div>
          <h1 className="text-3xl font-bold">{userProfile.displayName}</h1>
          <p className="text-gray-400">{userProfile.email}</p>
          <div className="mt-4 flex space-x-4">
              <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-400 uppercase">Engagement Points</p>
                  <p className="text-2xl font-bold text-indigo-400">{userProfile.engagementPoints || 0}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-400 uppercase">Channel Member</p>
                  <p className="text-2xl font-bold text-indigo-400">{userProfile.isChannelMember ? 'Yes' : 'No'}</p>
              </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-6">My Giveaway Entries</h2>
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">Giveaway ID: {entry.giveawayId}</p>
                  <p className="text-sm text-gray-400">Entered on: {entry.timestamp.toDate().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-400">Method: {entry.entryMethod}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {entry.multiplier > 1 && <span className="text-xs font-bold text-yellow-400 px-2 py-1 rounded-full bg-yellow-900/50">x{entry.multiplier}</span>}
                  <span className={`px-3 py-1 text-xs font-semibold text-white ${statusColors[entry.status]} rounded-full uppercase`}>
                    {entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center">You haven't entered any giveaways yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
