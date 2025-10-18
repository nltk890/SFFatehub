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
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000 * 60); // update every minute

        return () => clearTimeout(timer);
    });

    const timerComponents: React.ReactNode[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval as keyof typeof timeLeft]) {
            return;
        }
        timerComponents.push(
            <span key={interval}>
                {timeLeft[interval as keyof typeof timeLeft]} {interval}{" "}
            </span>
        );
    });

    return (
        <div className="text-sm text-yellow-500 dark:text-yellow-400">
            {timerComponents.length ? <>{timerComponents} left</> : <span>Giveaway ended!</span>}
        </div>
    );
};


const GiveawayCard: React.FC<GiveawayCardProps> = ({ giveaway }) => {
  const badgeColor = giveaway.type === 'CodeL' ? 'bg-red-500' : 'bg-blue-500';
  const statusColor = giveaway.status === 'active' ? 'text-green-600 dark:text-green-400' : giveaway.status === 'drawing' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <img className="h-48 w-full object-cover" src={giveaway.imageUrl || `https://picsum.photos/seed/${giveaway.id}/400/200`} alt={giveaway.title} />
      <div className="p-6">
        <div className="flex justify-between items-start">
            <span className={`inline-block px-3 py-1 text-xs font-semibold text-white ${badgeColor} rounded-full uppercase`}>
                {giveaway.type}
            </span>
            <span className={`text-xs font-bold uppercase ${statusColor}`}>{giveaway.status}</span>
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{giveaway.title}</h3>
        <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-300 font-semibold">{giveaway.reward}</p>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm h-10 overflow-hidden">{giveaway.description}</p>
        <div className="mt-4">
             {giveaway.status === 'active' && <CountdownTimer endDate={giveaway.endDate} />}
             {giveaway.status === 'finished' && giveaway.publishedWinnerDisplayName && (
                <p className="text-sm text-green-600 dark:text-green-400">Winner: {giveaway.publishedWinnerDisplayName}</p>
             )}
        </div>
        <div className="mt-6">
          <Link
            to={`/giveaway/${giveaway.id}`}
            className="w-full text-center block bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GiveawayCard;
