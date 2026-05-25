// Singleton in-memory store shared across API route modules in the same process.
// Provides cross-device access within a single server instance.

const store = new Map<string, unknown[]>();

export function getSection(section: string): unknown[] {
  return store.get(section) ?? [];
}

export function setSection(section: string, data: unknown[]): void {
  store.set(section, [...data]);
}

export function addToSection(section: string, item: unknown): void {
  const existing = store.get(section) ?? [];
  store.set(section, [item, ...existing]);
}
