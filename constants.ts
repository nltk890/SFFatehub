// Fix: Removed non-resolving vite/client type reference. Types for import.meta.env are now defined globally in types.ts.

// IMPORTANT: This is now set via GitHub secrets as VITE_ADMIN_UID
export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;

export const COLLECTIONS = {
    USERS: 'users',
    GIVEAWAYS: 'giveaways',
    ENTRIES: 'entries',
    GIVEAWAY_CODES: 'giveaway_codes',
};