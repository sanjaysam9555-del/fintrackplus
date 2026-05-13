import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import appIcon from '@/assets/app-icon.png';
import { SEO } from '@/components/SEO';

const Refund = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Refund & Cancellation Policy | FinTrack+"
        description="FinTrack+ refund and cancellation terms — 7-day refund window, cancel anytime, and how subscription renewals work."
        path="/refund"
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-10">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-[25%] overflow-hidden shrink-0">
            <img src={appIcon} alt="FinTrack⁺" className="w-full h-full object-cover scale-[1.3]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Refund & Cancellation Policy</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <p className="text-xs">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
            <p>This Refund & Cancellation Policy applies to all subscription plans purchased through FinTrack⁺ ("we", "our", "us"), a product by Saffron Events. By subscribing to our Service, you agree to the terms outlined below.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Subscription Plans</h2>
            <p>FinTrack⁺ offers monthly and annual subscription plans. All plans are billed in advance for the chosen billing cycle. Your subscription will automatically renew at the end of each billing period unless cancelled.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Free Trial</h2>
            <p>If a free trial is offered, you will not be charged during the trial period. If you do not cancel before the trial ends, your subscription will automatically convert to a paid plan and you will be charged accordingly.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Cancellation Policy</h2>
            <p>You may cancel your subscription at any time through your account settings or by contacting us at <a href="mailto:support@fintrackplus.in" className="text-primary hover:underline">support@fintrackplus.in</a>.</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Upon cancellation, you will continue to have access to the Service until the end of your current billing period.</li>
              <li>No further charges will be applied after cancellation takes effect.</li>
              <li>Cancellation does not delete your data — your data will be retained for 30 days after the subscription expires, after which it may be permanently deleted.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Refund Policy</h2>
            <p>We offer refunds under the following conditions:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-foreground">Within 7 days of purchase:</strong> If you are unsatisfied with the Service, you may request a full refund within 7 days of your initial purchase or renewal.</li>
              <li><strong className="text-foreground">Service disruption:</strong> If the Service experiences significant downtime or technical issues that prevent you from using it for an extended period, you may be eligible for a partial or full refund at our discretion.</li>
              <li><strong className="text-foreground">Duplicate charges:</strong> If you are charged more than once for the same billing period, the duplicate charge will be refunded in full.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Non-Refundable Cases</h2>
            <p>Refunds will not be provided in the following cases:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Requests made after 7 days of purchase or renewal</li>
              <li>Failure to cancel before the renewal date</li>
              <li>Partial use of the subscription during a billing period</li>
              <li>Violation of our Terms of Service leading to account suspension</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. How to Request a Refund</h2>
            <p>To request a refund, please contact us at <a href="mailto:support@fintrackplus.in" className="text-primary hover:underline">support@fintrackplus.in</a> with the following details:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Your registered email address</li>
              <li>Date of purchase</li>
              <li>Reason for the refund request</li>
            </ul>
            <p>We will review your request and respond within 5–7 business days. Approved refunds will be processed to the original payment method within 7–10 business days.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Changes to This Policy</h2>
            <p>We reserve the right to update this policy at any time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Contact Us</h2>
            <p>For any questions regarding this Refund & Cancellation Policy, please reach out to us at:</p>
            <p><a href="mailto:support@fintrackplus.in" className="text-primary hover:underline">support@fintrackplus.in</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Refund;
