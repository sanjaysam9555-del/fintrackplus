import { ReactNode } from "react";
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
 */
export const PaywallGate = ({ children }: PaywallGateProps) => {
  const { isActive, loading } = useSubscription();
  const location = useLocation();

  // Allow billing page through without check
  if (location.pathname.endsWith("/billing")) {
    return <>{children}</>;
  }

  if (loading) {
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
