import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { appPath } from "@/lib/domainUtils";
import { PageLoader } from "@/components/ui/skeleton-loader";
import { readAccessCache } from "@/lib/subscriptionCache";

interface PaywallGateProps {
  children: ReactNode;
}

/**
 * Paywall — cache-first.
 *
 * - If the local access cache says active, render immediately. Never bounces
 *   on cold opens / iOS resumes / tab focus.
 * - If there's no cache yet (first ever login), wait for the first server
 *   read, then decide.
 * - Realtime updates that flip access to FALSE update the cache silently;
 *   we do NOT yank the user mid-session — the redirect only takes effect
 *   on the next app open. This avoids surprise paywall mid-edit.
 *
 * Server verification is owned by `useSubscriptionVerifier`, not this gate.
 */
export const PaywallGate = ({ children }: PaywallGateProps) => {
  const { isActive, loading } = useSubscription();
  const { user } = useAuth();
  const { orgId } = useUserRole();
  const location = useLocation();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Snapshot the access decision from the moment this gate first had data.
  // Realtime cancellations mid-session won't yank an active user out.
  const initialActiveRef = useRef<boolean | null>(null);
  if (initialActiveRef.current === null && !loading) {
    initialActiveRef.current = isActive;
  }

  const isBilling = location.pathname.endsWith("/billing");
  const hasCache = !!readAccessCache(orgId);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setOnboardingDone(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setOnboardingDone(Boolean(data?.onboarding_completed));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (isBilling) {
    return <>{children}</>;
  }

  // Only block on a TRUE first-ever load (no cache, still loading) or while
  // we don't yet know onboarding state.
  if ((loading && !hasCache) || onboardingDone === null) {
    return <PageLoader className="min-h-screen" />;
  }

  const initialActive = initialActiveRef.current ?? isActive;
  if (!initialActive && onboardingDone) {
    return <Navigate to={appPath("/billing")} replace />;
  }

  return <>{children}</>;
};
