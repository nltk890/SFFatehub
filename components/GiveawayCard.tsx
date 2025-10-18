import React from 'react';
import { Link } from 'react-router-dom';
import { Giveaway } from '../types';
import { Timestamp } from 'firebase/firestore';

interface GiveawayCardProps {
  giveaway: Giveaway;
}

const CountdownTimer: React.FC<{ endDate: Timestamp }> = ({ endDate }) => {
    const calculateTimeLeft = () => {
        const difference = +endDate.toDate() - +new Date();
        let timeLeft: {days?: number, hours?: number, minutes?: number, seconds?: number} = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });
    
    if (!Object.keys(timeLeft).length) return <span className="text-sm font-semibold text-red-500 dark:text-red-400">Giveaway ended!</span>;

    return (
        <div className="text-sm text-center text-indigo-800 dark:text-indigo-200 font-semibold space-x-2">
            <span>{timeLeft.days || 0}d</span>
            <span>{timeLeft.hours || 0}h</span>
            <span>{timeLeft.minutes || 0}m</span>
            <span>{timeLeft.seconds || 0}s left</span>
        </div>
    );
};


const GiveawayCard: React.FC<GiveawayCardProps> = ({ giveaway }) => {
  const badgeColor = giveaway.type === 'CodeL' ? 'from-red-500 to-orange-500' : 'from-blue-500 to-cyan-500';
  const statusColor = giveaway.status === 'active' ? 'text-green-500 dark:text-green-400' : giveaway.status === 'drawing' ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-500';

  return (
    <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300 relative border border-slate-200 dark:border-slate-700">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
      <div className="relative">
        <div className="overflow-hidden h-48">
          <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={giveaway.imageUrl || `https://picsum.photos/seed/${giveaway.id}/400/200`} alt={giveaway.title} />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start">
              <span className={`inline-block px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r ${badgeColor} rounded-full uppercase tracking-wider`}>
                  {giveaway.type}
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${statusColor}`}>{giveaway.status}</span>
          </div>
          <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white truncate">{giveaway.title}</h3>
          <p className="mt-1 text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 font-semibold">{giveaway.reward}</p>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm h-10 overflow-hidden">{giveaway.description}</p>
          <div className="mt-4 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
               {giveaway.status === 'active' && <CountdownTimer endDate={giveaway.endDate} />}
               {giveaway.status === 'finished' && giveaway.publishedWinnerDisplayName && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Winner: {giveaway.publishedWinnerDisplayName}</p>
               )}
          </div>
          <div className="mt-6">
            <Link
              to={`/giveaway/${giveaway.id}`}
              className="w-full text-center block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiveawayCard;
