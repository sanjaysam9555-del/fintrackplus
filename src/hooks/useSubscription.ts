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
  const isActive =
    subscription?.status === "active" ||
    (subscription?.status === "trialing" && trialEndMs > now) ||
    (subscription?.status === "created" && trialEndMs > now);

  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    subscription,
    loading: loading || roleLoading,
    isActive,
    trialActive,
    trialDaysLeft,
    refetch: fetch,
  };
};
