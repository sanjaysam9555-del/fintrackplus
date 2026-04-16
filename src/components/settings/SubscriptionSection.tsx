import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, Calendar, Receipt, Loader2, Download, AlertTriangle, Pencil, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { appPath } from "@/lib/domainUtils";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount_total: number;
  paid_at: string;
  pdf_path: string | null;
}

interface SubscriptionSectionProps {
  onBack: () => void;
}

export const SubscriptionSection = ({ onBack }: SubscriptionSectionProps) => {
  const { subscription, isActive, trialActive, trialDaysLeft, needsMandateAuth, refetch } = useSubscription();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [stateCode, setStateCode] = useState("");

  useEffect(() => {
    if (subscription) {
      setBusinessName(subscription.customer_business_name || "");
      setGstin(subscription.customer_gstin || "");
      setAddress(subscription.customer_address || "");
      setStateCode(subscription.customer_state_code || "");
    }
  }, [subscription]);

  useEffect(() => {
    if (!subscription?.org_id) return;
    supabase
      .from("invoices")
      .select("id, invoice_number, amount_total, paid_at, pdf_path")
      .eq("org_id", subscription.org_id)
      .order("paid_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setInvoices((data as InvoiceRow[]) ?? []));
  }, [subscription?.org_id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Subscription will be cancelled at the end of your current billing period.");
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-billing-details", {
        body: {
          customer_business_name: businessName,
          customer_gstin: gstin,
          customer_address: address,
          customer_state_code: stateCode,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Billing details updated");
      setEditingDetails(false);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSavingDetails(false);
    }
  };

  const downloadInvoice = async (path: string, invoiceNumber: string) => {
    try {
      const { data, error } = await supabase.storage.from("invoices").download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber.replace(/\//g, "-")}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      toast.error("Failed to download invoice");
    }
  };

  const statusBadge = () => {
    if (!subscription) return { label: "No subscription", color: "bg-muted text-muted-foreground" };
    if (subscription.cancel_at_period_end) return { label: "Cancelling", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };
    switch (subscription.status) {
      case "active": return { label: "Active", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" };
      case "trialing": return { label: "Trial", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" };
      case "created": return { label: "Verification pending", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };
      case "past_due": return { label: "Past due", color: "bg-destructive/15 text-destructive" };
      case "halted": return { label: "Paused", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };
      case "cancelled":
      case "expired": return { label: "Cancelled", color: "bg-destructive/15 text-destructive" };
      default: return { label: subscription.status, color: "bg-muted text-muted-foreground" };
    }
  };
  const badge = statusBadge();

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Subscription</h1>
        </div>
      </div>

      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Plan</p>
              <h2 className="text-xl font-bold mt-1">FinTrack+ Pro</h2>
              <p className="text-sm text-muted-foreground">₹599/mo · incl. 18% GST</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>
          </div>

          {trialActive && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                <span>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in free trial</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                The ₹1–₹5 mandate authorization charge is auto-refunded within 5–7 business days.
                Your first ₹599 charge happens when the trial ends.
              </p>
            </div>
          )}

          {needsMandateAuth && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">Payment method verification incomplete</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Complete the ₹1–₹5 refundable verification (RBI mandate) to start your trial.
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(appPath("/billing"), { state: { from: "settings:subscription" } })} className="w-full">
                Complete Verification
              </Button>
            </div>
          )}

          {subscription?.current_period_end && subscription.status === "active" && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar size={14} />
              {subscription.cancel_at_period_end ? "Access until " : "Next billing on "}
              <span className="font-medium text-foreground">
                {new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {!subscription?.razorpay_subscription_id && (
              <Button onClick={() => navigate(appPath("/billing"), { state: { from: "settings:subscription" } })} size="sm">Subscribe Now</Button>
            )}
            {subscription?.razorpay_subscription_id && !subscription.cancel_at_period_end && subscription.status !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <X size={14} className="mr-1.5" /> Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="text-destructive" size={20} />
                      Cancel subscription?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Your subscription will remain active until{" "}
                      <span className="font-medium text-foreground">
                        {subscription.current_period_end
                          ? new Date(subscription.current_period_end).toLocaleDateString("en-IN")
                          : "the end of your current period"}
                      </span>
                      . After that, your team will lose access to FinTrack+ unless you re-subscribe.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive hover:bg-destructive/90">
                      {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, cancel"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </motion.div>

        {/* Billing details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Receipt size={16} className="text-muted-foreground" /> Billing Details
              </h3>
              <p className="text-xs text-muted-foreground">Used on your tax invoices</p>
            </div>
            {!editingDetails && (
              <Button variant="ghost" size="sm" onClick={() => setEditingDetails(true)}>
                <Pencil size={14} className="mr-1" /> Edit
              </Button>
            )}
          </div>

          {editingDetails ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="biz2">Business name</Label>
                <Input id="biz2" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="gstin2">GSTIN</Label>
                <Input id="gstin2" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} maxLength={15} />
              </div>
              <div>
                <Label htmlFor="addr2">Address</Label>
                <Textarea id="addr2" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
              </div>
              <div>
                <Label htmlFor="state2">State code (2-digit)</Label>
                <Input id="state2" value={stateCode} onChange={(e) => setStateCode(e.target.value)} maxLength={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveDetails} disabled={savingDetails} size="sm">
                  {savingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check size={14} className="mr-1" /> Save</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingDetails(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm space-y-1.5">
              <div className="flex">
                <span className="text-muted-foreground w-32 shrink-0">Business:</span>
                <span>{subscription?.customer_business_name || <em className="text-muted-foreground">Not set</em>}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32 shrink-0">GSTIN:</span>
                <span className="font-mono">{subscription?.customer_gstin || <em className="text-muted-foreground">Not set</em>}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32 shrink-0">Address:</span>
                <span className="whitespace-pre-line">{subscription?.customer_address || <em className="text-muted-foreground">Not set</em>}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-32 shrink-0">State code:</span>
                <span>{subscription?.customer_state_code || <em className="text-muted-foreground">Not set</em>}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Invoice history */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-card"
        >
          <h3 className="font-semibold mb-3">Invoice History</h3>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet. Your first invoice will appear here after the trial ends.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · ₹"}{inv.amount_total.toFixed(2)}
                    </p>
                  </div>
                  {inv.pdf_path && (
                    <Button variant="ghost" size="sm" onClick={() => downloadInvoice(inv.pdf_path!, inv.invoice_number)}>
                      <Download size={14} className="mr-1" /> PDF
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
