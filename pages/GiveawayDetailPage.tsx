import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Giveaway, Entry, GiveawayCode } from '../types';
import { COLLECTIONS } from '../constants';

const GiveawayDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryCode, setEntryCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [probability, setProbability] = useState<number | null>(null);

  const fetchGiveawayAndEntryStatus = useCallback(async () => {
    if (!id || !user) return;
    try {
        setLoading(true);
        const giveawayDocRef = doc(db, COLLECTIONS.GIVEAWAYS, id);
        const giveawayDoc = await getDoc(giveawayDocRef);

        if (giveawayDoc.exists()) {
            const giveawayData = Object.assign({ id: giveawayDoc.id }, giveawayDoc.data()) as Giveaway;
            setGiveaway(giveawayData);
            
            const entriesQuery = query(
                collection(db, COLLECTIONS.ENTRIES),
                where('giveawayId', '==', id),
                where('userId', '==', user.uid)
            );
            const userEntries = await getDocs(entriesQuery);
            if (!userEntries.empty) {
                setHasEntered(true);
                // Calculate probability if user has entered
                 if (giveawayData.status === 'active' && giveawayData.type === 'CodeS') {
                    const allEntriesQuery = query(collection(db, COLLECTIONS.ENTRIES), where('giveawayId', '==', id));
                    const allEntriesSnapshot = await getDocs(allEntriesQuery);
                    const allEntries = allEntriesSnapshot.docs.map(doc => doc.data() as Entry);

                    const totalWeight = allEntries.reduce((sum, entry) => sum + entry.multiplier, 0);
                    const userEntryData = userEntries.docs[0].data() as Entry;
                    
                    if (userEntryData && totalWeight > 0) {
                        const userWeight = userEntryData.multiplier;
                        setProbability((userWeight / totalWeight) * 100);
                    }
                }
            } else {
                setHasEntered(false);
            }

        } else {
            setError('Giveaway not found.');
        }
    } catch (err) {
        console.error(err);
        setError('Failed to load giveaway details.');
    } finally {
        setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchGiveawayAndEntryStatus();
  }, [fetchGiveawayAndEntryStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !giveaway) return;
    if (hasEntered) {
        setMessage({ type: 'error', text: 'You have already entered this giveaway.' });
        return;
    }
    if (giveaway.status !== 'active') {
        setMessage({ type: 'error', text: 'This giveaway is not active.' });
        return;
    }
    if (userProfile.verificationStatus !== 'approved') {
        setMessage({ type: 'error', text: 'Your account must be verified to enter. Please check your profile.' });
        return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
        let multiplier = 1;
        let usedCode = '';

        if (entryCode.trim()) {
            const codesRef = collection(db, COLLECTIONS.GIVEAWAY_CODES);
            const q = query(codesRef, 
                where('giveawayId', '==', giveaway.id),
                where('codeString', '==', entryCode.trim())
            );
            const codeQuerySnapshot = await getDocs(q);

            if (codeQuerySnapshot.empty) {
                setMessage({ type: 'error', text: 'Invalid code.' });
                setSubmitting(false);
                return;
            }
            const codeData = codeQuerySnapshot.docs[0].data() as GiveawayCode;
            multiplier = codeData.multiplier;
            usedCode = entryCode.trim();
        }

        const newEntry: Omit<Entry, 'id'> = {
            giveawayId: giveaway.id,
            userId: user.uid,
            userDisplayName: userProfile.publicDisplayName || userProfile.displayName || 'Anonymous',
            entryMethod: 'code',
            value: usedCode,
            multiplier: multiplier,
            status: 'approved',
            timestamp: Timestamp.now(),
        };

        await addDoc(collection(db, COLLECTIONS.ENTRIES), newEntry);

        setMessage({ type: 'success', text: 'Your entry has been submitted successfully!' });
        setHasEntered(true);
        setEntryCode('');
        fetchGiveawayAndEntryStatus(); // Re-fetch data to update probability
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to submit entry. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!giveaway) return null;

  const isGiveawayActive = giveaway.status === 'active';
  const isUserVerified = userProfile?.verificationStatus === 'approved';

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
      <img className="h-64 w-full object-cover rounded-lg mb-6" src={giveaway.imageUrl || `https://picsum.photos/seed/${giveaway.id}/800/400`} alt={giveaway.title} />
      <h1 className="text-4xl font-bold text-gradient">{giveaway.title}</h1>
      <p className="text-xl font-semibold text-indigo-500 dark:text-indigo-300 mt-2">{giveaway.reward}</p>
      <p className="mt-4 text-slate-700 dark:text-slate-300">{giveaway.description}</p>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Ends on: {giveaway.endDate.toDate().toLocaleString()}</p>

      {giveaway.status === 'finished' && giveaway.publishedWinnerDisplayName && (
          <div className="mt-8 p-4 bg-gradient-to-r from-green-400 to-teal-500 rounded-lg text-center shadow-lg">
              <h3 className="text-2xl font-bold text-white">Giveaway Finished!</h3>
              <p className="text-lg mt-2 text-white">Congratulations to the winner: <span className="font-bold">{giveaway.publishedWinnerDisplayName}</span></p>
          </div>
      )}

      {isGiveawayActive && (
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold mb-4 text-center text-gradient">Enter Giveaway</h2>
            {hasEntered ? (
                <div className="p-6 bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 rounded-r-lg text-center">
                    <p className="text-green-800 dark:text-green-200 font-bold text-xl">You're in!</p>
                    <p className="text-green-700 dark:text-green-300 font-semibold text-lg mt-1">Good luck!</p>
                    
                    {giveaway.type === 'CodeS' && probability !== null && (
                        <div className="mt-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300">Your current estimated chance of winning is:</p>
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{probability.toFixed(2)}%</p>
                        </div>
                    )}
                    {giveaway.type === 'CodeL' && (
                        <p className="text-sm mt-4 text-slate-600 dark:text-slate-400 italic">For this type of giveaway, the winner is selected from top contenders based on engagement. Keep participating in the community to increase your chances!</p>
                    )}
                </div>
            ) : !isUserVerified ? (
                 <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 rounded-r-lg text-center">
                    <p className="text-yellow-700 dark:text-yellow-300 font-semibold">Your account must be approved before you can enter giveaways.</p>
                     <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">Please go to your <Link to="/profile" className="font-bold underline hover:text-yellow-600 dark:hover:text-yellow-200">Profile Page</Link> to check your verification status.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="entryCode" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Secret Code (Optional)</label>
                    <input
                    type="text"
                    id="entryCode"
                    value={entryCode}
                    onChange={(e) => setEntryCode(e.target.value)}
                    placeholder="Enter a code for a multiplier"
                    className="w-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-md border-2 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                </div>
                
                {message && (
                    <div className={`p-3 my-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || !isGiveawayActive}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all disabled:from-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {submitting ? 'Submitting...' : 'Enter Now'}
                </button>
                </form>
            )}
            </div>
      )}
    </div>
  );
};

export default GiveawayDetailPage;