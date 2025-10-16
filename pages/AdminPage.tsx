
import React, { useState, useEffect, useCallback } from 'react';
// Fix: Imported `getDoc` to resolve "Cannot find name 'getDoc'" error.
import { collection, addDoc, getDoc, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Giveaway, GiveawayType, GiveawayStatus, Entry, UserProfile } from '../types';
import { COLLECTIONS } from '../constants';

type AdminTab = 'create' | 'manage';

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('manage');

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-indigo-400">Admin Panel</h1>
            <div className="flex justify-center border-b border-gray-700 mb-8">
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-3 font-semibold ${activeTab === 'manage' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}
                >
                    Manage Giveaways
                </button>
                <button
                    onClick={() => setActiveTab('create')}
                    className={`px-6 py-3 font-semibold ${activeTab === 'create' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}
                >
                    Create Giveaway
                </button>
            </div>
            {activeTab === 'create' && <CreateGiveawayForm />}
            {activeTab === 'manage' && <ManageGiveaways />}
        </div>
    );
};


const CreateGiveawayForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('');
    const [type, setType] = useState<GiveawayType>('CodeS');
    const [endDate, setEndDate] = useState('');
    const [requiredVideoId, setRequiredVideoId] = useState('');
    const [trackedVideoIds, setTrackedVideoIds] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const newGiveaway = {
                title,
                description,
                reward,
                type,
                endDate: Timestamp.fromDate(new Date(endDate)),
                status: 'active' as GiveawayStatus,
                requiredVideoId: type === 'CodeS' ? requiredVideoId : '',
                trackedVideoIds: type === 'CodeL' ? trackedVideoIds.split(',').map(id => id.trim()) : [],
                imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/400/200`,
            };

            await addDoc(collection(db, COLLECTIONS.GIVEAWAYS), newGiveaway);
            setMessage('Giveaway created successfully!');
            // Reset form
            setTitle(''); setDescription(''); setReward(''); setType('CodeS'); setEndDate(''); setRequiredVideoId(''); setTrackedVideoIds(''); setImageUrl('');
        } catch (error) {
            console.error(error);
            setMessage('Failed to create giveaway.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-xl">
             <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                <InputField label="Reward" value={reward} onChange={e => setReward(e.target.value)} required />
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600" rows={3}></textarea>
                </div>
                <InputField label="Image URL" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Optional. e.g., https://picsum.photos/..." />
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as GiveawayType)} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600">
                        <option value="CodeS">Code S (Standard)</option>
                        <option value="CodeL">Code L (Weighted)</option>
                    </select>
                </div>
                <InputField label="End Date" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                {type === 'CodeS' && <InputField label="Required Video ID" value={requiredVideoId} onChange={e => setRequiredVideoId(e.target.value)} />}
                {type === 'CodeL' && <InputField label="Tracked Video IDs (comma-separated)" value={trackedVideoIds} onChange={e => setTrackedVideoIds(e.target.value)} />}
                
                {message && <p className="text-center">{message}</p>}
                
                <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-500 disabled:bg-gray-500">
                    {submitting ? 'Creating...' : 'Create Giveaway'}
                </button>
            </form>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <input {...props} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600" />
    </div>
);


const ManageGiveaways: React.FC = () => {
    const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);

    const fetchGiveaways = useCallback(async () => {
        setLoading(true);
        const q = query(collection(db, COLLECTIONS.GIVEAWAYS), orderBy('endDate', 'desc'));
        const snapshot = await getDocs(q);
        // Fix: Spread types may only be created from object types. Replaced object spread with `Object.assign`.
        setGiveaways(snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()) as Giveaway)));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchGiveaways();
    }, [fetchGiveaways]);

    if(selectedGiveaway) {
        return <GiveawayEntries giveaway={selectedGiveaway} onBack={() => {
            setSelectedGiveaway(null);
            fetchGiveaways();
        }} />
    }

    if (loading) return <p>Loading giveaways...</p>;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="space-y-4">
                {giveaways.map(g => (
                    <div key={g.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-bold">{g.title} <span className="text-xs text-gray-400">({g.type})</span></p>
                            <p className="text-sm text-gray-300">Status: {g.status}</p>
                            {g.winnerDisplayName && <p className="text-sm text-green-400">Winner: {g.winnerDisplayName}</p>}
                        </div>
                        <button onClick={() => setSelectedGiveaway(g)} className="bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-500">
                            View Entries
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


const GiveawayEntries: React.FC<{ giveaway: Giveaway; onBack: () => void; }> = ({ giveaway, onBack }) => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        const q = query(collection(db, COLLECTIONS.ENTRIES), where('giveawayId', '==', giveaway.id), orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        // Fix: Spread types may only be created from object types. Replaced object spread with `Object.assign`.
        setEntries(snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()) as Entry)));
        setLoading(false);
    }, [giveaway.id]);
    
    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleEntryStatusUpdate = async (entryId: string, status: Entry['status']) => {
        const entryRef = doc(db, COLLECTIONS.ENTRIES, entryId);
        await updateDoc(entryRef, { status });
        fetchEntries();
    };

    const handleDrawWinner = async () => {
        const approvedEntries = entries.filter(e => e.status === 'approved');
        if (approvedEntries.length === 0) {
            alert('No approved entries to draw from.');
            return;
        }

        let winner: Entry;

        if (giveaway.type === 'CodeS') {
            const randomIndex = Math.floor(Math.random() * approvedEntries.length);
            winner = approvedEntries[randomIndex];
        } else { // CodeL Logic
            // In a real app, this logic should be a secure cloud function.
            // This is a simplified frontend simulation.
            const userPoints: { [userId: string]: { points: number; entry: Entry} } = {};
            for(const entry of approvedEntries) {
                const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, entry.userId));
                if(userDoc.exists()){
                    const userProfile = userDoc.data() as UserProfile;
                    let points = userProfile.engagementPoints || 0;
                    if(userProfile.isChannelMember) {
                        points *= 2;
                    }
                    if(!userPoints[entry.userId] || points > userPoints[entry.userId].points) {
                         userPoints[entry.userId] = { points, entry };
                    }
                }
            }

            const sortedUsers = Object.values(userPoints).sort((a,b) => b.points - a.points);
            const topContenders = sortedUsers.slice(0, 5);
            if(topContenders.length === 0) {
                alert("Could not determine top contenders.");
                return;
            }
            const randomIndex = Math.floor(Math.random() * topContenders.length);
            winner = topContenders[randomIndex].entry;
        }

        const giveawayRef = doc(db, COLLECTIONS.GIVEAWAYS, giveaway.id);
        await updateDoc(giveawayRef, {
            winnerId: winner.userId,
            winnerDisplayName: winner.userDisplayName,
            status: 'finished',
        });
        alert(`Winner is ${winner.userDisplayName}!`);
        onBack();
    };
    

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <button onClick={onBack} className="mb-4 bg-gray-600 px-4 py-2 rounded-md hover:bg-gray-500">&larr; Back</button>
            <h2 className="text-2xl font-bold mb-4">{giveaway.title} Entries</h2>
            {giveaway.status === 'active' && <button onClick={handleDrawWinner} className="w-full mb-4 bg-green-600 py-3 rounded-md hover:bg-green-500 font-bold">Draw Winner</button>}
            
            {loading ? <p>Loading entries...</p> : (
                 <div className="space-y-2">
                    {entries.map(entry => (
                        <div key={entry.id} className="bg-gray-700 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                                <p>{entry.userDisplayName}</p>
                                <p className="text-sm text-gray-400">Status: <span className="font-bold">{entry.status}</span></p>
                            </div>
                            <p className="text-xs text-gray-500">{entry.timestamp.toDate().toLocaleString()}</p>
                             {entry.entryMethod === 'screenshot' && (
                                <div className="mt-2">
                                    <a href={entry.value} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-sm">View Screenshot</a>
                                    {entry.status === 'pending' && (
                                        <div className="flex space-x-2 mt-2">
                                            <button onClick={() => handleEntryStatusUpdate(entry.id, 'approved')} className="bg-green-600 text-xs px-2 py-1 rounded">Approve</button>
                                            <button onClick={() => handleEntryStatusUpdate(entry.id, 'rejected')} className="bg-red-600 text-xs px-2 py-1 rounded">Reject</button>
                                        </div>
                                    )}
                                </div>
                             )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export default AdminPage;
