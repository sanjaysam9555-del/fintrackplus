import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { appPath } from "@/lib/domainUtils";
import { PageLoader } from "@/components/ui/skeleton-loader";
import { isDenyCacheTrustworthy, readAccessCache } from "@/lib/subscriptionCache";

interface PaywallGateProps {
  children: ReactNode;
}

// If the network never returns, fall back to the cache verdict after this.
const MAX_DENY_WAIT_MS = 4000;

/**
 * Paywall — cache-first for ALLOW, server-confirmed for DENY.
 *
 * - Cached "active" → render immediately. No flicker on cold opens / iOS
 *   resumes / tab focus.
 * - Cached "inactive" that's stale (older than the trust window) → show a
 *   loader and wait for the live fetch before redirecting. This prevents
 *   comped/paying users from getting bounced to /billing when their cache
 *   was written before access was granted.
 * - Realtime updates that flip access to FALSE update the cache silently;
 *   we do NOT yank the user mid-session — the redirect only takes effect
 *   on the next app open. This avoids surprise paywall mid-edit.
 */
export const PaywallGate = ({ children }: PaywallGateProps) => {
  const { isActive, loading } = useSubscription();
  const { user } = useAuth();
  const { orgId } = useUserRole();
  const location = useLocation();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [denyWaitTimedOut, setDenyWaitTimedOut] = useState(false);

  // Snapshot the access decision from the moment this gate first had data.
  // Realtime cancellations mid-session won't yank an active user out.
  const initialActiveRef = useRef<boolean | null>(null);
  if (initialActiveRef.current === null && !loading) {
    initialActiveRef.current = isActive;
  }

  const isBilling = location.pathname.endsWith("/billing");
  const denyCacheTrusted = isDenyCacheTrustworthy(readAccessCache(orgId));

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

  // Safety valve: if a fresh fetch never completes, stop blocking forever.
  useEffect(() => {
    if (!loading) {
      setDenyWaitTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setDenyWaitTimedOut(true), MAX_DENY_WAIT_MS);
    return () => window.clearTimeout(t);
  }, [loading]);

  if (isBilling) {
    return <>{children}</>;
  }

  // Wait for onboarding lookup always.
  if (onboardingDone === null) {
    return <PageLoader className="min-h-screen" />;
  }

  // While the subscription fetch is in flight, only block when the current
  // decision would be to DENY. If cache already grants access, render
  // children immediately (zero-flicker fast path for paying/comped users).
  if (loading && !denyWaitTimedOut) {
    if (!denyCacheTrusted) {
      // Either no cache, or cache says deny but is stale → must wait for
      // the server before sending the user to /billing.
      return <PageLoader className="min-h-screen" />;
    }
    // Cached allow → fall through and render children.
  }

  const initialActive = initialActiveRef.current ?? isActive;
  if (!initialActive && onboardingDone) {
    return <Navigate to={appPath("/billing")} replace />;
  }

  return <>{children}</>;
};
