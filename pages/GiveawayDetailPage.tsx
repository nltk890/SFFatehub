
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Giveaway, Entry, EntryMethod, EntryStatus } from '../types';
import { COLLECTIONS } from '../constants';

const GiveawayDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryCode, setEntryCode] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  const fetchGiveawayAndEntryStatus = useCallback(async () => {
    if (!id || !user) return;
    try {
        setLoading(true);
        const giveawayDocRef = doc(db, COLLECTIONS.GIVEAWAYS, id);
        const giveawayDoc = await getDoc(giveawayDocRef);

        if (giveawayDoc.exists()) {
            // Fix: Spread types may only be created from object types. Replaced object spread with `Object.assign`.
            setGiveaway(Object.assign({ id: giveawayDoc.id }, giveawayDoc.data()) as Giveaway);
            
            const entriesQuery = query(
                collection(db, COLLECTIONS.ENTRIES),
                where('giveawayId', '==', id),
                where('userId', '==', user.uid)
            );
            const userEntries = await getDocs(entriesQuery);
            if (!userEntries.empty) {
                setHasEntered(true);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshotFile(e.target.files[0]);
    }
  };

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

    setSubmitting(true);
    setMessage(null);

    try {
      let entryMethod: EntryMethod = 'code';
      let value = entryCode;
      let status: EntryStatus = 'approved'; // auto-approve code entries

      if (screenshotFile) {
        entryMethod = 'screenshot';
        status = 'pending'; // screenshots need manual approval
        const storageRef = ref(storage, `entries/${giveaway.id}/${user.uid}-${screenshotFile.name}`);
        const snapshot = await uploadBytes(storageRef, screenshotFile);
        value = await getDownloadURL(snapshot.ref);
      } else if (!entryCode.trim()) {
        setMessage({type: 'error', text: 'Please enter a code or upload a screenshot.'});
        setSubmitting(false);
        return;
      }
      
      let multiplier = 1;
      const codeParts = entryCode.toLowerCase().split('_x');
      if (codeParts.length === 2 && !isNaN(parseInt(codeParts[1]))) {
          multiplier = parseInt(codeParts[1]);
      }

      const newEntry: Omit<Entry, 'id'> = {
        giveawayId: giveaway.id,
        userId: user.uid,
        userDisplayName: userProfile.displayName || 'Anonymous',
        entryMethod,
        value,
        multiplier,
        status,
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, COLLECTIONS.ENTRIES), newEntry);
      setMessage({ type: 'success', text: 'Your entry has been submitted successfully!' });
      setHasEntered(true);
      setEntryCode('');
      setScreenshotFile(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to submit entry. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!giveaway) return null;

  const isGiveawayActive = giveaway.status === 'active';

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-2xl">
      <img className="h-64 w-full object-cover rounded-lg mb-6" src={giveaway.imageUrl || `https://picsum.photos/seed/${giveaway.id}/800/400`} alt={giveaway.title} />
      <h1 className="text-4xl font-bold text-indigo-400">{giveaway.title}</h1>
      <p className="text-lg text-indigo-300 mt-2">{giveaway.reward}</p>
      <p className="mt-4 text-gray-300">{giveaway.description}</p>
      <p className="mt-4 text-sm text-gray-400">Ends on: {giveaway.endDate.toDate().toLocaleString()}</p>

      {giveaway.status === 'finished' && giveaway.winnerDisplayName && (
          <div className="mt-8 p-4 bg-green-900/50 border border-green-500 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-green-400">Giveaway Finished!</h3>
              <p className="text-lg mt-2">Congratulations to the winner: <span className="font-bold">{giveaway.winnerDisplayName}</span></p>
          </div>
      )}

      {isGiveawayActive && (
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Enter Giveaway</h2>
            {hasEntered ? (
                <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg text-center">
                    <p className="text-green-400 font-semibold">You have successfully entered this giveaway!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="entryCode" className="block text-sm font-medium text-gray-300 mb-2">Secret Code (from video)</label>
                    <input
                    type="text"
                    id="entryCode"
                    value={entryCode}
                    onChange={(e) => setEntryCode(e.target.value)}
                    placeholder="e.g., SECRETCODE_x3"
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="my-4 text-center text-gray-400">OR</div>
                <div className="mb-4">
                    <label htmlFor="screenshot" className="block text-sm font-medium text-gray-300 mb-2">Upload Screenshot (for manual verification)</label>
                    <input
                    type="file"
                    id="screenshot"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                    />
                    {screenshotFile && <p className="text-xs mt-2 text-gray-400">Selected: {screenshotFile.name}</p>}
                </div>

                {message && (
                    <div className={`p-3 my-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                    {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting || !isGiveawayActive}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
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
