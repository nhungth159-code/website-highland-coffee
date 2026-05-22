import type { StoredOrder } from "./orders";

// Singleton in-memory store — shared across all API route modules within the same Node.js process.
// In development (next dev) this persists for the whole session.
// On Vercel, it persists within a warm function instance (good enough for demos).
export const serverOrders: StoredOrder[] = [];
