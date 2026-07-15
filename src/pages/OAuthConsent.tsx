import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; client_id?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthDecisionResult = { redirect_url?: string; redirect_to?: string };
const authOauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<{ data: OAuthDecisionResult | null; error: { message: string } | null }>;
    denyAuthorization: (id: string) => Promise<{ data: OAuthDecisionResult | null; error: { message: string } | null }>;
  };
}).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";
  const { user, loading, signOut } = useAuth();
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!authorizationId) {
      setError("Missing authorization_id in the request.");
      return;
    }
    if (!user) {
      const next = window.location.pathname + window.location.search;
      navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await authOauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, user, loading, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await authOauth.approveAuthorization(authorizationId)
      : await authOauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (loading || (!user && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold">Could not load this request</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const clientName = details.client?.name ?? "an application";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="max-w-md w-full bg-card/80 backdrop-blur-xl border rounded-3xl p-6 shadow-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">
            Connect {clientName} to FinTrack<sup className="text-[0.6em]">+</sup>
          </h1>
          <p className="text-sm text-muted-foreground">
            This lets <span className="font-medium text-foreground">{clientName}</span> use FinTrack
            <sup>+</sup> as you.
          </p>
        </div>

        <div className="rounded-xl border bg-background/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Signed in as</span>
            <span className="font-medium truncate ml-2">{user?.email}</span>
          </div>
          <div className="text-muted-foreground">
            {clientName} will be able to call FinTrack<sup>+</sup>'s enabled tools while you are
            signed in. This does not bypass FinTrack<sup>+</sup>'s permissions or backend policies.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => decide(true)}>
            {busy ? "Connecting…" : "Approve"}
          </Button>
        </div>

        <button
          type="button"
          onClick={async () => {
            await signOut();
          }}
          className="text-xs text-muted-foreground hover:text-foreground mx-auto block"
        >
          Not you? Sign out
        </button>
      </div>
    </div>
  );
}
