
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Giveaway } from '../types';
import GiveawayCard from '../components/GiveawayCard';
import { COLLECTIONS } from '../constants';

const HomePage: React.FC = () => {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGiveaways = async () => {
      try {
        const q = query(collection(db, COLLECTIONS.GIVEAWAYS), orderBy('endDate', 'desc'));
        const querySnapshot = await getDocs(q);
        // Fix: Spread types may only be created from object types. Replaced object spread with `Object.assign`.
        const giveawaysData = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()) as Giveaway));
        setGiveaways(giveawaysData);
      } catch (err) {
        console.error(err);
        setError('Failed to load giveaways. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGiveaways();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading giveaways...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }
  
  const activeGiveaways = giveaways.filter(g => g.status === 'active');
  const pastGiveaways = giveaways.filter(g => g.status !== 'active');

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-center text-indigo-400">Active Giveaways</h1>
      {activeGiveaways.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeGiveaways.map(giveaway => (
            <GiveawayCard key={giveaway.id} giveaway={giveaway} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">No active giveaways at the moment. Check back soon!</p>
      )}

      <h2 className="text-3xl font-bold mt-16 mb-8 text-center text-indigo-400">Past Giveaways</h2>
      {pastGiveaways.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pastGiveaways.map(giveaway => (
            <GiveawayCard key={giveaway.id} giveaway={giveaway} />
          ))}
        </div>
      ) : (
         <p className="text-center text-gray-400">No past giveaways yet.</p>
      )}
    </div>
  );
};

export default HomePage;
