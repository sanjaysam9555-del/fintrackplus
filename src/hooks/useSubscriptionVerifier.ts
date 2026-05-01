import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { useSubscription } from "./useSubscription";
import { ACCESS_CACHE_TTL_MS, readAccessCache } from "@/lib/subscriptionCache";

/**
 * Runs at most ONE server-side subscription verification per 24h, and only
 * after a delay so it's never on the critical path of app open / login.
 *
 * Mount once near the root of the authenticated tree. Everything else
 * (PaywallGate, Billing, Settings) reads from the cache populated here +
 * by realtime updates.
 */

// Wait at least this long after mount before ever hitting the server.
const POST_MOUNT_DELAY_MS = 60 * 1000; // 60s

export const useSubscriptionVerifier = () => {
  const { user } = useAuth();
  const { orgId } = useUserRole();
  const { refetch } = useSubscription();
  const hasScheduledRef = useRef(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId || !orgId) return;
    if (hasScheduledRef.current) return;
    hasScheduledRef.current = true;

    const last = readAccessCache(orgId)?.lastVerifiedAt ?? 0;
    const sinceLast = Date.now() - last;
    const dueIn = Math.max(0, ACCESS_CACHE_TTL_MS - sinceLast);
    const delay = Math.max(POST_MOUNT_DELAY_MS, dueIn);

    const t = window.setTimeout(() => {
      // Best-effort. refetch() writes the cache on success.
      refetch().catch((err) => {
        console.warn("[SubscriptionVerifier] refresh failed:", err);
      });
    }, delay);

    return () => {
      window.clearTimeout(t);
      hasScheduledRef.current = false;
    };
    // We deliberately do NOT depend on `refetch` — it's stable enough and
    // we don't want to re-arm the timer on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, orgId]);
};
