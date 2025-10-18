import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, Timestamp, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Giveaway, GiveawayType, GiveawayStatus, Entry, UserProfile } from '../types';
import { COLLECTIONS } from '../constants';

type AdminTab = 'create' | 'manage' | 'verification';

interface EntryWithUser extends Entry {
    userEmail?: string;
}

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('manage');

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-indigo-600 dark:text-indigo-400">Admin Panel</h1>
            <div className="flex justify-center border-b border-gray-300 dark:border-gray-700 mb-8">
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-3 font-semibold ${activeTab === 'manage' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Manage Giveaways
                </button>
                <button
                    onClick={() => setActiveTab('create')}
                    className={`px-6 py-3 font-semibold ${activeTab === 'create' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Create Giveaway
                </button>
                 <button
                    onClick={() => setActiveTab('verification')}
                    className={`px-6 py-3 font-semibold ${activeTab === 'verification' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    User Verification
                </button>
            </div>
            {activeTab === 'create' && <CreateGiveawayForm />}
            {activeTab === 'manage' && <ManageGiveaways />}
            {activeTab === 'verification' && <UserVerificationQueue />}
        </div>
    );
};


const CreateGiveawayForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('');
    const [type, setType] = useState<GiveawayType>('CodeS');
    const [endDate, setEndDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [codes, setCodes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const newGiveawayData = {
                title,
                description,
                reward,
                type,
                endDate: Timestamp.fromDate(new Date(endDate)),
                status: 'active' as GiveawayStatus,
                imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/400/200`,
            };

            const giveawayDocRef = await addDoc(collection(db, COLLECTIONS.GIVEAWAYS), newGiveawayData);
            
            const codesToCreate = codes.split('\n').filter(line => line.trim() !== '');
            if (codesToCreate.length > 0) {
                const batch = writeBatch(db);
                codesToCreate.forEach(line => {
                    const [codeString, multiplierStr] = line.split(',');
                    if (codeString && multiplierStr) {
                        const codeRef = doc(collection(db, COLLECTIONS.GIVEAWAY_CODES));
                        batch.set(codeRef, {
                            giveawayId: giveawayDocRef.id,
                            codeString: codeString.trim(),
                            multiplier: parseInt(multiplierStr.trim()) || 1,
                        });
                    }
                });
                await batch.commit();
            }

            setMessage('Giveaway created successfully!');
            setTitle(''); setDescription(''); setReward(''); setType('CodeS'); setEndDate(''); setImageUrl(''); setCodes('');
        } catch (error) {
            console.error(error);
            setMessage('Failed to create giveaway.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
             <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                <InputField label="Reward" value={reward} onChange={e => setReward(e.target.value)} required />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600" rows={3}></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entry Codes (one per line, format: CODE,MULTIPLIER)</label>
                    <textarea value={codes} onChange={e => setCodes(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600" rows={5} placeholder="SUMMERFUN,2&#10;BEACHDAY,5"></textarea>
                </div>
                <InputField label="Image URL" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Optional. e.g., https://picsum.photos/..." />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as GiveawayType)} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600">
                        <option value="CodeS">Code S (Standard)</option>
                        <option value="CodeL">Code L (Weighted)</option>
                    </select>
                </div>
                <InputField label="End Date" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <input {...props} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md border border-gray-300 dark:border-gray-600" />
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="space-y-4">
                {giveaways.map(g => (
                    <div key={g.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-bold">{g.title} <span className="text-xs text-gray-500 dark:text-gray-400">({g.type})</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Status: {g.status}</p>
                            {g.publishedWinnerDisplayName && <p className="text-sm text-green-600 dark:text-green-400">Winner: {g.publishedWinnerDisplayName}</p>}
                        </div>
                        <button onClick={() => setSelectedGiveaway(g)} className="bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-500 text-white">
                            Manage
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


const GiveawayEntries: React.FC<{ giveaway: Giveaway; onBack: () => void; }> = ({ giveaway, onBack }) => {
    const [entries, setEntries] = useState<EntryWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentGiveaway, setCurrentGiveaway] = useState<Giveaway>(giveaway);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        const q = query(collection(db, COLLECTIONS.ENTRIES), where('giveawayId', '==', giveaway.id), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        const entriesData = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()) as Entry));

        if (entriesData.length > 0) {
            const userIds = [...new Set(entriesData.map(e => e.userId))];
            const userDocs = await Promise.all(userIds.map(uid => getDoc(doc(db, COLLECTIONS.USERS, uid))));
            const usersMap = new Map<string, UserProfile>();
            userDocs.forEach(userDoc => {
                if (userDoc.exists()) {
                    usersMap.set(userDoc.id, userDoc.data() as UserProfile);
                }
            });
    
            const entriesWithUsers: EntryWithUser[] = entriesData.map(entry => ({
                ...entry,
                userEmail: usersMap.get(entry.userId)?.email || 'N/A'
            }));
            setEntries(entriesWithUsers);
        } else {
            setEntries([]);
        }
        
        setLoading(false);
    }, [giveaway.id]);
    
    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);
    
    const handleDrawProvisionalWinner = async () => {
        if (entries.length === 0) {
            alert('No approved entries to draw from.');
            return;
        }

        let winner: Entry;

        if (giveaway.type === 'CodeS') {
            const allEntriesWeighted = entries.flatMap(e => Array(e.multiplier).fill(e));
            const randomIndex = Math.floor(Math.random() * allEntriesWeighted.length);
            winner = allEntriesWeighted[randomIndex];
        } else { // CodeL Logic
            const userPoints: { [userId: string]: { points: number; entry: Entry} } = {};
            for(const entry of entries) {
                const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, entry.userId));
                if(userDoc.exists()){
                    const userProfile = userDoc.data() as UserProfile;
                    let points = (userProfile.engagementPoints || 0) * entry.multiplier;
                    if(userProfile.isChannelMember) points *= 2;
                    if(!userPoints[entry.userId] || points > userPoints[entry.userId].points) {
                         userPoints[entry.userId] = { points, entry };
                    }
                }
            }

            const sortedUsers = Object.values(userPoints).sort((a,b) => b.points - a.points);
            const topContenders = sortedUsers.slice(0, 10);
            if(topContenders.length === 0) {
                alert("Could not determine top contenders."); return;
            }
            const randomIndex = Math.floor(Math.random() * topContenders.length);
            winner = topContenders[randomIndex].entry;
        }

        handleSetWinner(winner, false);
    };

    const handleSetWinner = async (entry: Entry, confirm = true) => {
        const proceed = confirm ? window.confirm(`Set ${entry.userDisplayName} as the provisional winner?`) : true;
        if (proceed) {
             const giveawayRef = doc(db, COLLECTIONS.GIVEAWAYS, giveaway.id);
            const updatedData = {
                provisionalWinnerId: entry.userId,
                provisionalWinnerDisplayName: entry.userDisplayName,
                status: 'drawing' as GiveawayStatus,
            };
            await updateDoc(giveawayRef, updatedData);
            setCurrentGiveaway({...currentGiveaway, ...updatedData });
        }
    }

    const handlePublishWinner = async () => {
        if (!currentGiveaway.provisionalWinnerId) return;
        const giveawayRef = doc(db, COLLECTIONS.GIVEAWAYS, giveaway.id);
        await updateDoc(giveawayRef, {
            publishedWinnerId: currentGiveaway.provisionalWinnerId,
            publishedWinnerDisplayName: currentGiveaway.provisionalWinnerDisplayName,
            status: 'finished' as GiveawayStatus,
            provisionalWinnerId: '',
            provisionalWinnerDisplayName: '',
        });
        alert(`Winner ${currentGiveaway.provisionalWinnerDisplayName} has been published!`);
        onBack();
    }
    
    const handleExport = () => {
        const dataStr = JSON.stringify(entries.map(({userDisplayName, userEmail, multiplier, value}) => ({userDisplayName, userEmail, multiplier, code: value})), null, 2);
        const dataBlob = new Blob([dataStr], {type : 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${giveaway.title.replace(/\s/g, '_')}_entries.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <button onClick={onBack} className="mb-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">&larr; Back</button>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{currentGiveaway.title} Entries ({entries.length})</h2>
                {entries.length > 0 && <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500">Export to JSON</button>}
            </div>

            {currentGiveaway.status === 'drawing' && currentGiveaway.provisionalWinnerDisplayName && (
                 <div className="my-4 p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-500 rounded-lg text-center">
                    <p className="font-bold text-yellow-700 dark:text-yellow-400">Provisional Winner: {currentGiveaway.provisionalWinnerDisplayName}</p>
                    <div className="flex justify-center space-x-4 mt-2">
                        <button onClick={handlePublishWinner} className="bg-green-600 px-4 py-2 rounded-md text-white">Publish Winner</button>
                        <button onClick={handleDrawProvisionalWinner} className="bg-red-600 px-4 py-2 rounded-md text-white">Redraw</button>
                    </div>
                </div>
            )}
            
            {currentGiveaway.status === 'active' && <button onClick={handleDrawProvisionalWinner} className="w-full mb-4 bg-green-600 py-3 rounded-md hover:bg-green-500 font-bold text-white">Draw Provisional Winner</button>}
            
            {loading ? <p>Loading entries...</p> : (
                 <div className="space-y-2 max-h-96 overflow-y-auto">
                    {entries.map(entry => (
                        <div key={entry.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p><span className="font-semibold">{entry.userDisplayName}</span> (x{entry.multiplier})</p>
                                <p className="text-xs text-gray-500">{entry.userEmail}</p>
                            </div>
                            {currentGiveaway.status === 'active' && (
                                <button onClick={() => handleSetWinner(entry)} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-md hover:bg-indigo-500">Set as Winner</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const UserVerificationQueue: React.FC = () => {
    const [users, setUsers] = useState<(UserProfile & {id: string})[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingUsers = useCallback(async () => {
        setLoading(true);
        const q = query(collection(db, COLLECTIONS.USERS), where('verificationStatus', '==', 'pending'));
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()) as UserProfile & {id: string})));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPendingUsers();
    }, [fetchPendingUsers]);

    const handleVerification = async (userId: string, newStatus: 'approved' | 'rejected') => {
        const userRef = doc(db, COLLECTIONS.USERS, userId);
        await updateDoc(userRef, { verificationStatus: newStatus });
        fetchPendingUsers(); // Refresh list
    };
    
    if (loading) return <p>Loading verification queue...</p>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
             <h2 className="text-2xl font-bold mb-4">Pending Verifications ({users.length})</h2>
             {users.length === 0 ? <p className="text-center text-gray-500 dark:text-gray-400">No pending verifications.</p> : (
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md flex items-center justify-between">
                            <div>
                                <p className="font-bold">{user.publicDisplayName || user.displayName}</p>
                                <a href={user.verificationImageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">View Verification Image</a>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleVerification(user.id, 'approved')} className="bg-green-600 text-white text-xs px-3 py-2 rounded hover:bg-green-500">Approve</button>
                                <button onClick={() => handleVerification(user.id, 'rejected')} className="bg-red-600 text-white text-xs px-3 py-2 rounded hover:bg-red-500">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
};

export default AdminPage;
