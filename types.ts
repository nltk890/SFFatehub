// Fix: Add a triple-slash directive to include Vite's client types. This provides type definitions for `import.meta.env` and resolves errors in other files.
/// <reference types="vite/client" />

import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  youtubeChannelId?: string;
  isSubscribed?: boolean;
  isChannelMember?: boolean;
  engagementPoints?: number;
}

export type GiveawayType = 'CodeL' | 'CodeS';
export type GiveawayStatus = 'active' | 'drawing' | 'finished';

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  type: GiveawayType;
  reward: string;
  status: GiveawayStatus;
  endDate: Timestamp;
  requiredVideoId?: string;
  trackedVideoIds?: string[];
  winnerId?: string;
  winnerDisplayName?: string;
  imageUrl?: string;
}

export type EntryMethod = 'code' | 'screenshot';
export type EntryStatus = 'pending' | 'approved' | 'rejected';

export interface Entry {
  id: string;
  giveawayId: string;
  userId: string;
  userDisplayName: string;
  entryMethod: EntryMethod;
  value: string; // code or screenshot URL
  multiplier: number;
  status: EntryStatus;
  timestamp: Timestamp;
}