import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import appIcon from '@/assets/app-icon.png';
import { SEO } from '@/components/SEO';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service | FinTrack+"
        description="The terms and conditions governing your use of FinTrack+, the GST-ready finance tracker for Indian event planners."
        path="/terms"
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-[25%] overflow-hidden shrink-0">
            <img src={appIcon} alt="FinTrack⁺" className="w-full h-full object-cover scale-[1.3]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <p className="text-xs">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using FinTrack⁺ (the "Service"), a product by Saffron Events, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>FinTrack⁺ is a financial tracking and management application designed for event planners in India. It allows users to track income, expenses, projects, vendors, and partners with features like GST tracking, AI-powered insights, and offline access.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Account Registration</h2>
            <p>You must provide a valid email address and create a password to register. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to use the Service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Subscription & Pricing</h2>
            <p>The Service is offered on a subscription basis at ₹499/month. Subscription fees are billed monthly starting from the date of initial purchase.</p>
            <p><strong className="text-foreground">30-Day Money-Back Guarantee:</strong> If you are not satisfied with the Service within the first 30 days of your initial subscription, you may request a full refund by contacting us at <a href="mailto:support@fintrackplus.in" className="text-primary hover:underline">support@fintrackplus.in</a>.</p>
            <p><strong className="text-foreground">Cancellation:</strong> You may cancel your subscription at any time. Upon cancellation, you will retain access until the end of your current billing period. No partial refunds are provided for mid-cycle cancellations beyond the 30-day guarantee period.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to any part of the Service</li>
              <li>Interfere with or disrupt the Service's infrastructure</li>
              <li>Share your account credentials with third parties</li>
              <li>Use automated tools to scrape or extract data from the Service</li>
              <li>Upload malicious files or content</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Your Data</h2>
            <p>You retain ownership of all data you enter into the Service. We do not claim any intellectual property rights over your financial data, project information, or other content.</p>
            <p>You are solely responsible for the accuracy of the data you enter. The Service is a tracking and management tool and does not constitute financial, tax, or legal advice.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Service Availability</h2>
            <p>We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. The offline mode allows limited functionality when internet access is unavailable.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, Saffron Events and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.</p>
            <p>Our total liability shall not exceed the amount paid by you for the Service in the 12 months preceding the claim.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Saffron Events from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Termination</h2>
            <p>We reserve the right to suspend or terminate your account if you violate these Terms or engage in behaviour that is harmful to other users or the Service. Upon termination, your right to access the Service ceases immediately.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">12. Changes to Terms</h2>
            <p>We may modify these Terms at any time. We will notify users of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">13. Contact Us</h2>
            <p>For any questions regarding these Terms, please contact us at:</p>
            <p><a href="mailto:support@fintrackplus.in" className="text-primary hover:underline">support@fintrackplus.in</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
