// Fix: Add Vite client types to resolve import.meta.env error.
/// <reference types="vite/client" />

// IMPORTANT: This is now set via GitHub secrets as VITE_ADMIN_UID
export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;

export const COLLECTIONS = {
    USERS: 'users',
    GIVEAWAYS: 'giveaways',
    ENTRIES: 'entries',
    GIVEAWAY_CODES: 'giveaway_codes',
};