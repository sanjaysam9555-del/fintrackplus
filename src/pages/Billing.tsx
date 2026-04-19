import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Check, Sparkles, Shield, Receipt, Calendar, ArrowLeft, Info, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { appPath } from "@/lib/domainUtils";

declare global {
  interface Window { Razorpay?: any }
}

const PRICE = 599;
const LIVE_HOSTS = ["fintrackplus.com", "www.fintrackplus.com"];
const LIVE_BILLING_URL = "https://fintrackplus.com/application/billing";
const GST_RATE = 18;
const NET = +(PRICE / (1 + GST_RATE / 100)).toFixed(2);
const GST_AMOUNT = +(PRICE - NET).toFixed(2);

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Billing = () => {
  const { user } = useAuth();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { subscription, isActive, trialActive, trialDaysLeft, needsMandateAuth, refetch } = useSubscription();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [stateCode, setStateCode] = useState("");
  const isLiveHost = typeof window !== "undefined" && LIVE_HOSTS.includes(window.location.hostname);

  useEffect(() => {
    if (subscription) {
      setBusinessName(subscription.customer_business_name || "");
      setGstin(subscription.customer_gstin || "");
      setAddress(subscription.customer_address || "");
      setStateCode(subscription.customer_state_code || "");
    }
  }, [subscription]);

  // If subscription is fully active (not trial), bounce back to app
  useEffect(() => {
    if (!roleLoading && isActive && subscription?.status === "active") {
      // user can view but it's an info page in that case
    }
  }, [roleLoading, isActive, subscription]);

  const handleSubscribe = async () => {
    if (!isOwner) {
      toast.error("Only the organization owner can manage billing");
      return;
    }
    if (!isLiveHost) {
      toast.error("Subscriptions can only be purchased on app.fintrackplus.com");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Failed to load Razorpay checkout");

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          customer_name: businessName || user?.email || "Customer",
          customer_business_name: businessName,
          customer_gstin: gstin,
          customer_address: address,
          customer_state_code: stateCode,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const { subscription_id, razorpay_key_id } = data;

      const rzp = new window.Razorpay({
        key: razorpay_key_id,
        subscription_id,
        name: "FinTrack+",
        description: "Mandate setup (₹1–₹5, refundable). Trial billing starts after 7 days.",
        theme: { color: "#1665B8" },
        prefill: { email: user?.email },
        handler: async () => {
          toast.success("Payment method verified! Activating your trial…");
          // Poll for webhook to flip status to 'trialing'
          const start = Date.now();
          let activated = false;
          while (Date.now() - start < 15000) {
            await new Promise((r) => setTimeout(r, 1500));
            await refetch();
            const { data: fresh } = await supabase
              .from("subscriptions")
              .select("status")
              .eq("razorpay_subscription_id", subscription_id)
              .maybeSingle();
            if (fresh && (fresh.status === "trialing" || fresh.status === "active")) {
              activated = true;
              break;
            }
          }
          if (activated) {
            toast.success("Trial activated! 7 days of full access.");
            setTimeout(() => navigate(appPath("/")), 1000);
          } else {
            toast.message("Verification received. Trial will activate within a minute.");
          }
          setSubmitting(false);
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment method verification cancelled. Trial not started.");
            setSubmitting(false);
          },
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp.error?.description || "Payment verification failed. Trial not started.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout");
      setSubmitting(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 safe-top pb-12">
      <div className="max-w-2xl mx-auto p-4">
        <button
          onClick={() => {
            // Smart back: prefer browser history if we have an in-app entry,
            // otherwise deep-link into Settings → Subscription.
            const hasInAppHistory =
              typeof window !== "undefined" &&
              window.history.length > 1 &&
              document.referrer &&
              document.referrer.includes(window.location.host);
            if (hasInAppHistory) {
              navigate(-1);
            } else {
              navigate(appPath("/"), { state: { openSettings: "subscription" } });
            }
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Status banner */}
        {trialActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
          >
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in your free trial
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a payment method to continue uninterrupted after the trial ends.
            </p>
          </motion.div>
        )}

        {needsMandateAuth && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3"
          >
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Payment method verification incomplete
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your trial hasn't started yet. Complete the ₹1–₹5 refundable verification below to activate it.
              </p>
            </div>
          </motion.div>
        )}

        {!isActive && !needsMandateAuth && !trialActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20"
          >
            <p className="text-sm font-medium text-destructive">Your subscription is inactive</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Subscribe below to regain full access to FinTrack+.
            </p>
          </motion.div>
        )}

        {isOwner && !isLiveHost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3"
          >
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Subscriptions are only available on the live app
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You're on a preview/sandbox URL. To subscribe, please open{" "}
                <a
                  href="https://app.fintrackplus.com/billing"
                  className="underline font-medium text-amber-700 dark:text-amber-400"
                >
                  app.fintrackplus.com/billing
                </a>
                .
              </p>
            </div>
          </motion.div>
        )}

        {/* RBI Mandate explainer — shown before user starts trial */}
        {isOwner && !isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3"
          >
            <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                About the ₹1–₹5 verification charge
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Per RBI guidelines for recurring payments, Razorpay charges a small refundable amount
                (₹1–₹5) to verify your payment method. This is <strong>auto-refunded within 5–7 business days</strong>.
                Your trial starts only after this verification succeeds. Your first ₹599 charge happens after the 7-day trial.
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border shadow-card overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} />
              <span className="text-sm font-semibold uppercase tracking-wide opacity-90">FinTrack+ Pro</span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-5xl font-bold">₹{PRICE}</span>
              <span className="text-base opacity-80">/month</span>
            </div>
            <p className="text-sm opacity-90 mt-1">Inclusive of 18% GST</p>
          </div>

          {/* Price breakdown */}
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subscription (net)</span>
              <span className="font-medium">₹{NET.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">GST @ 18%</span>
              <span className="font-medium">₹{GST_AMOUNT.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-border">
              <span className="font-semibold">Total per month</span>
              <span className="font-bold text-primary">₹{PRICE.toFixed(2)}</span>
            </div>
          </div>

          {/* Features */}
          <div className="p-6 space-y-3">
            {[
              "7-day free trial — no charge upfront",
              "Up to 3 team members per organization",
              "Unlimited transactions, projects & reports",
              "Automated daily backups",
              "Branded GST tax invoices for every payment",
              "Cancel anytime — keeps working until period end",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center mt-0.5 shrink-0">
                  <Check size={12} className="text-primary" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Billing details (optional) */}
          {isOwner && !subscription?.razorpay_subscription_id && (
            <div className="p-6 border-t border-border space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <Receipt size={16} className="text-muted-foreground" />
                  Billing details
                </h3>
                <p className="text-xs text-muted-foreground">
                  Optional. Add your business GSTIN to receive tax invoices addressed to your business (for input credit).
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="biz">Business name</Label>
                  <Input id="biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Pvt Ltd" />
                </div>
                <div>
                  <Label htmlFor="gstin">GSTIN (optional)</Label>
                  <Input id="gstin" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="addr">Billing address</Label>
                  <Textarea id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, PIN" rows={2} />
                </div>
                <div>
                  <Label htmlFor="state">State code (2-digit)</Label>
                  <Input id="state" value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="e.g. 27 for Maharashtra" maxLength={2} />
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="p-6 border-t border-border">
            {!isOwner ? (
              <div className="text-center">
                <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Only your organization owner can manage billing. Please ask them to subscribe.
                </p>
              </div>
            ) : needsMandateAuth ? (
              <Button
                onClick={handleSubscribe}
                disabled={submitting || !isLiveHost}
                size="lg"
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading checkout…</>
                ) : !isLiveHost ? (
                  "Available on app.fintrackplus.com"
                ) : (
                  "Complete Verification to Start Trial"
                )}
              </Button>
            ) : subscription?.razorpay_subscription_id && isActive ? (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <Check size={14} /> Subscription active
                </div>
                {subscription.current_period_end && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Calendar size={12} />
                    Next billing: {new Date(subscription.current_period_end).toLocaleDateString("en-IN")}
                  </p>
                )}
                <Button onClick={() => navigate(appPath("/"))} className="mt-2 w-full">Go to App</Button>
              </div>
            ) : (
              <Button
                onClick={handleSubscribe}
                disabled={submitting || !isLiveHost}
                size="lg"
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading checkout…</>
                ) : !isLiveHost ? (
                  "Available on app.fintrackplus.com"
                ) : (
                  "Start 7-Day Free Trial"
                )}
              </Button>
            )}
            <p className="text-[11px] text-center text-muted-foreground mt-3">
              You won't be charged for 7 days. Cancel anytime in Settings.
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Secure payments powered by Razorpay · GST Tax Invoice issued for every payment
        </p>
      </div>
    </div>
  );
};

export default Billing;
