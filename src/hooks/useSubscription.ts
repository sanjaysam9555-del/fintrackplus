import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import {
  AccessCacheEntry,
  isDenyCacheTrustworthy,
  readAccessCache,
  recomputeIsActive,
  writeAccessCache,
} from "@/lib/subscriptionCache";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "halted"
  | "created";

export interface Subscription {
  id: string;
  org_id: string;
  status: SubscriptionStatus;
  trial_end: string | null;
  current_period_end: string | null;
  current_period_start: string | null;
  cancel_at_period_end: boolean;
  is_comped?: boolean;
  comped_reason?: string | null;
  comped_until?: string | null;
  razorpay_subscription_id: string | null;
  razorpay_customer_id: string | null;
  customer_gstin: string | null;
  customer_business_name: string | null;
  customer_address: string | null;
  customer_state_code: string | null;
}

/**
 * Build a cache entry from a freshly-read subscription row.
 */
const cacheEntryFromRow = (row: Subscription | null): AccessCacheEntry => {
  const now = Date.now();
  const isComped = !!row?.is_comped;
  const status = (row?.status ?? null) as AccessCacheEntry["status"];
  const trialEnd = row?.trial_end ?? null;
  const compedUntil = row?.comped_until ?? null;

  const entry: AccessCacheEntry = {
    isActive: false,
    status,
    isComped,
    trialEnd,
    compedUntil,
    cachedAt: now,
    lastVerifiedAt: now,
  };
  entry.isActive = recomputeIsActive(entry, now);
  return entry;
};

export const useSubscription = () => {
  const { orgId, loading: roleLoading } = useUserRole();

  // Seed access state synchronously from the cache so paywall decisions
  // never flicker on cold opens / iOS resumes — but only trust the seed
  // when it grants access OR was server-verified recently. A stale "deny"
  // seed must wait for a fresh fetch before the gate can act on it.
  const seedCache = readAccessCache(orgId);
  const seedTrusted = isDenyCacheTrustworthy(seedCache);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [cacheEntry, setCacheEntry] = useState<AccessCacheEntry | null>(seedCache);
  const [loading, setLoading] = useState(!seedTrusted);
  const hasLoadedOnce = useRef(false);

  // If orgId resolves later, re-seed.
  useEffect(() => {
    const seed = readAccessCache(orgId);
    if (seed) {
      setCacheEntry(seed);
      if (isDenyCacheTrustworthy(seed)) setLoading(false);
    }
  }, [orgId]);

  const fetch = useCallback(async () => {
    if (!hasLoadedOnce.current && !readAccessCache(orgId)) setLoading(true);

    if (!orgId) {
      setSubscription(null);
      hasLoadedOnce.current = true;
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) {
      console.error("[useSubscription]", error);
      // Don't clobber cache on transient errors.
      hasLoadedOnce.current = true;
      setLoading(false);
      return;
    }

    const row = (data as Subscription | null) ?? null;
    setSubscription(row);

    const entry = cacheEntryFromRow(row);
    writeAccessCache(orgId, entry);
    setCacheEntry(entry);

    hasLoadedOnce.current = true;
    setLoading(false);
  }, [orgId]);

  // Initial fetch — only once roles are known.
  useEffect(() => {
    if (!roleLoading) fetch();
  }, [fetch, roleLoading]);

  // Realtime updates
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`subscriptions-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `org_id=eq.${orgId}` },
        () => fetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, fetch]);

  // Decide access from cache when present, otherwise from the live row.
  const liveEntry = subscription ? cacheEntryFromRow(subscription) : null;
  const effective = cacheEntry ?? liveEntry;
  const isActive = effective ? recomputeIsActive(effective) : false;
  const isComped = !!effective?.isComped && isActive;

  const now = Date.now();
  const trialEndMs = effective?.trialEnd ? new Date(effective.trialEnd).getTime() : 0;
  const trialActive = effective?.status === "trialing" && trialEndMs > now;
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000)))
    : 0;

  const needsMandateAuth =
    !isComped &&
    subscription?.status === "created" &&
    !!subscription?.razorpay_subscription_id;

  const isStale =
    !isComped &&
    !!subscription &&
    (subscription.status === "expired" ||
      subscription.status === "cancelled" ||
      (subscription.status === "created" && !subscription.razorpay_subscription_id));

  return {
    subscription,
    loading: loading || roleLoading,
    isActive,
    isComped,
    trialActive,
    trialDaysLeft,
    needsMandateAuth,
    isStale,
    refetch: fetch,
    /** ms epoch of the last successful server verification, or 0 if never. */
    lastVerifiedAt: cacheEntry?.lastVerifiedAt ?? 0,
  };
};
