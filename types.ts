import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string | null; // From Google
  publicDisplayName?: string; // Chosen by user
  email: string | null;
  photoURL: string | null;
  youtubeChannelId?: string;
  isSubscribed?: boolean;
  isChannelMember?: boolean;
  engagementPoints?: number;
  verificationImageUrl?: string;
  verificationStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
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
  provisionalWinnerId?: string;
  provisionalWinnerDisplayName?: string;
  publishedWinnerId?: string;
  publishedWinnerDisplayName?: string;
  imageUrl?: string;
}

export type EntryMethod = 'code';
export type EntryStatus = 'pending' | 'approved' | 'rejected';

export interface Entry {
  id: string;
  giveawayId: string;
  userId: string;
  userDisplayName: string;
  entryMethod: EntryMethod;
  value: string; // code
  multiplier: number;
  status: EntryStatus;
  timestamp: Timestamp;
}

export interface GiveawayCode {
    id: string;
    giveawayId: string;
    codeString: string;
    multiplier: number;
    isUsed: boolean;
    usedBy: string | null;
}

// Fix: Add global type definitions for Vite environment variables to fix errors related to `import.meta.env`.
declare global {
  interface ImportMetaEnv {
    readonly VITE_ADMIN_UID: string;
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
