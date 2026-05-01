/**
 * Local cache of subscription access state.
 *
 * Why: cold app opens, iOS PWA resumes, and tab focus events were causing
 * `useSubscription` to start with `loading=true` → first DB read sometimes
 * lagged → `PaywallGate` bounced comped/paid users to /billing.
 *
 * Strategy: trust this cache for paywall decisions. A separate verifier hook
 * refreshes the cache from the server at most once every 24h, and only after
 * a delay so it's never on the critical path of app open / login.
 */

const KEY_PREFIX = "fintrack_sub_access_v1:";
const KEY_PATTERN = /^fintrack_sub_access_v1:/;

export const ACCESS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export type CachedSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "halted"
  | "created";

export interface AccessCacheEntry {
  isActive: boolean;
  status: CachedSubscriptionStatus | null;
  isComped: boolean;
  trialEnd: string | null;
  compedUntil: string | null;
  cachedAt: number;
  lastVerifiedAt: number;
}

const keyFor = (orgId: string) => `${KEY_PREFIX}${orgId}`;

export const readAccessCache = (orgId: string | null | undefined): AccessCacheEntry | null => {
  if (!orgId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(orgId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessCacheEntry;
    if (typeof parsed?.cachedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeAccessCache = (orgId: string, entry: AccessCacheEntry): void => {
  if (!orgId || typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(orgId), JSON.stringify(entry));
  } catch {
    /* ignore quota errors */
  }
};

export const clearAllAccessCaches = (): void => {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && KEY_PATTERN.test(k)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

/**
 * Re-evaluate `isActive` against the wall clock so an expired trial in cache
 * doesn't keep granting access just because the cache is "fresh".
 */
export const recomputeIsActive = (entry: AccessCacheEntry, nowMs = Date.now()): boolean => {
  // Comped: permanent if no compedUntil, else until that timestamp
  if (entry.isComped) {
    if (!entry.compedUntil) return true;
    return new Date(entry.compedUntil).getTime() > nowMs;
  }
  if (entry.status === "active") return true;
  if (entry.status === "trialing" && entry.trialEnd) {
    return new Date(entry.trialEnd).getTime() > nowMs;
  }
  return false;
};

/**
 * True if the cache was server-verified within the TTL window.
 * Drives the daily-check decision in the verifier hook.
 */
export const isCacheFresh = (
  entry: AccessCacheEntry | null,
  ttlMs = ACCESS_CACHE_TTL_MS,
  nowMs = Date.now(),
): boolean => {
  if (!entry) return false;
  return nowMs - entry.lastVerifiedAt < ttlMs;
};
