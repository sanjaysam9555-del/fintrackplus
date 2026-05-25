import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { useSubscription } from "./useSubscription";
import {
  ACCESS_CACHE_TTL_MS,
  DENY_CACHE_TRUST_MS,
  readAccessCache,
  recomputeIsActive,
} from "@/lib/subscriptionCache";

/**
 * Refreshes the subscription cache from the server.
 *
 * - Fresh "active" cache → defer up to 24h so we don't burn requests on the
 *   critical path of app open for paying / comped users.
 * - Empty cache, "deny" cache, or cache older than the deny-trust window →
 *   verify IMMEDIATELY. Stale deny verdicts otherwise trap users on
 *   /billing until realtime happens to fire.
 */

const POST_MOUNT_DELAY_MS = 60 * 1000; // 60s — only used on the happy path

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

    const entry = readAccessCache(orgId);
    const now = Date.now();
    const cachedActive = entry ? recomputeIsActive(entry, now) : false;
    const sinceLast = entry ? now - entry.lastVerifiedAt : Infinity;

    // Verify immediately if there's no cache, the cache denies access, or
    // it's older than the deny-trust window. Only defer when the cache is
    // both fresh AND grants access.
    const needsImmediate =
      !entry || !cachedActive || sinceLast > DENY_CACHE_TRUST_MS;

    const dueIn = Math.max(0, ACCESS_CACHE_TTL_MS - sinceLast);
    const delay = needsImmediate ? 0 : Math.max(POST_MOUNT_DELAY_MS, dueIn);

    const run = () => {
      refetch().catch((err) => {
        console.warn("[SubscriptionVerifier] refresh failed:", err);
      });
    };

    if (delay === 0) {
      run();
      return () => {
        hasScheduledRef.current = false;
      };
    }

    const t = window.setTimeout(run, delay);
    return () => {
      window.clearTimeout(t);
      hasScheduledRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, orgId]);
};
