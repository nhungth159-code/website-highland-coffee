import type { StoredOrder } from "./orders";

// Singleton in-memory store — shared across API route modules in the same process.
export const serverOrders: StoredOrder[] = [];

// Gmail sync state — prevents concurrent IMAP connections.
export let lastGmailSync = 0;
export let gmailSyncing = false;

export function setLastGmailSync(t: number) { lastGmailSync = t; }
export function setGmailSyncing(v: boolean)  { gmailSyncing = v; }
