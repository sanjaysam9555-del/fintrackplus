import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import { appPath } from "@/lib/domainUtils";

interface PaywallGateProps {
  children: ReactNode;
}

/**
 * Hard paywall: redirects to billing page if org has no active subscription.
 * The billing page itself is exempt so users can subscribe.
 *
 * Hardening: on the very first inactive read, we briefly wait + refetch once
 * to let any in-flight webhook reconciliation (subscription.authenticated /
 * subscription.charged) land before yanking the user to billing. Prevents the
 * "logged in → bounced to billing → realtime flips to active 200ms later" loop.
 */
export const PaywallGate = ({ children }: PaywallGateProps) => {
  const { isActive, loading, subscription, refetch } = useSubscription();
  const location = useLocation();
  const [grace, setGrace] = useState(true);

  // Allow billing page through without check
  const isBilling = location.pathname.endsWith("/billing");

  useEffect(() => {
    if (loading || isBilling) return;
    if (isActive) {
      setGrace(false);
      return;
    }
    // One-shot reconciliation: refetch after a short delay before we redirect.
    const t = setTimeout(async () => {
      await refetch();
      setGrace(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [loading, isActive, isBilling, refetch, subscription?.status]);

  if (isBilling) {
    return <>{children}</>;
  }

  if (loading || (!isActive && grace)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isActive) {
    return <Navigate to={appPath("/billing")} replace />;
  }

  return <>{children}</>;
};
