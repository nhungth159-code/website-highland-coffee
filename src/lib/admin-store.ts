// Persistent store backed by Upstash Redis so data is shared across all
// serverless instances and devices.  Falls back to in-memory when env vars
// are absent (local dev without .env.local configured).

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

const fallback = new Map<string, unknown[]>();

export async function getSection(section: string): Promise<unknown[]> {
  const r = getRedis();
  if (r) {
    try {
      const data = await r.get<unknown[]>(`admin:${section}`);
      return Array.isArray(data) ? data : [];
    } catch {
      // redis unavailable — fall through to in-memory
    }
  }
  return fallback.get(section) ?? [];
}

export async function setSection(section: string, data: unknown[]): Promise<void> {
  fallback.set(section, [...data]);
  const r = getRedis();
  if (r) {
    try {
      await r.set(`admin:${section}`, data);
    } catch { /* ignore */ }
  }
}

export async function addToSection(section: string, item: unknown): Promise<void> {
  const existing = await getSection(section);
  await setSection(section, [item, ...existing]);
}
