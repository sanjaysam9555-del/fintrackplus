import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

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

export const useSubscription = () => {
  const { orgId, loading: roleLoading } = useUserRole();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);

    if (!orgId) {
      setSubscription(null);
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
      setSubscription(null);
    } else {
      setSubscription(data as Subscription | null);
    }

    setLoading(false);
  }, [orgId]);

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

  const now = Date.now();
  const trialEndMs = subscription?.trial_end ? new Date(subscription.trial_end).getTime() : 0;
  const trialActive = subscription?.status === "trialing" && trialEndMs > now;

  // Complimentary access: org granted free use (e.g. founder, beta tester).
  // Permanent if comped_until is null, otherwise until that timestamp.
  const compedUntilMs = subscription?.comped_until
    ? new Date(subscription.comped_until).getTime()
    : Infinity;
  const isComped = !!subscription?.is_comped && compedUntilMs > now;

  // NOTE: status === "created" is intentionally EXCLUDED. Razorpay sets "created" before
  // mandate authentication. We only grant access once the webhook flips it to "trialing"
  // (subscription.authenticated event) or "active" (subscription.charged).
  const isActive =
    isComped ||
    subscription?.status === "active" ||
    (subscription?.status === "trialing" && trialEndMs > now);

  // Subscription was created in Razorpay but mandate not yet authenticated (₹1–₹5 auth pending)
  // Comped orgs never need mandate auth — even if a stale Razorpay "created"
  // subscription exists from before they were comped.
  const needsMandateAuth =
    !isComped &&
    subscription?.status === "created" &&
    !!subscription?.razorpay_subscription_id;

  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    subscription,
    loading: loading || roleLoading,
    isActive,
    isComped,
    trialActive,
    trialDaysLeft,
    needsMandateAuth,
    refetch: fetch,
  };
};
