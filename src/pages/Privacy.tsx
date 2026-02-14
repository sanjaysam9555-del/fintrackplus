import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import appIcon from '@/assets/app-icon.png';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-[25%] overflow-hidden shrink-0">
            <img src={appIcon} alt="FinTrack⁺" className="w-full h-full object-cover scale-[1.3]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <p className="text-xs">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p>FinTrack⁺ ("we", "our", "us") is a product by Saffron Events. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application at fintrackplus.com and app.fintrackplus.com (the "Service").</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p><strong className="text-foreground">Account Information:</strong> When you register, we collect your name, email address, and encrypted password.</p>
            <p><strong className="text-foreground">Financial Data:</strong> Transaction records, project details, vendor information, partner details, and categories you enter into the app. This data is yours and is stored securely.</p>
            <p><strong className="text-foreground">Usage Data:</strong> We may collect anonymized usage analytics such as pages visited, features used, and session duration to improve the Service.</p>
            <p><strong className="text-foreground">Device Information:</strong> Browser type, operating system, and device type for compatibility and support purposes.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To provide, operate, and maintain the Service</li>
              <li>To process your transactions and generate reports</li>
              <li>To send you account-related communications (verification emails, password resets)</li>
              <li>To improve and personalise your experience</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Storage & Security</h2>
            <p>Your data is stored on secure, encrypted cloud infrastructure. We use industry-standard security measures including encryption at rest and in transit, row-level security policies, and secure authentication protocols.</p>
            <p>We do not store your password in plain text. All passwords are hashed using industry-standard algorithms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-foreground">Cloud Infrastructure:</strong> For hosting and database services</li>
              <li><strong className="text-foreground">Payment Processing:</strong> For subscription billing (when applicable). We do not store your credit card details.</li>
              <li><strong className="text-foreground">Email Services:</strong> For sending transactional emails</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Cookies</h2>
            <p>We use essential cookies and local storage to maintain your login session and app preferences (such as theme settings). We do not use third-party tracking cookies.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:support@fintrackplus.in" className="text-primary hover:underline">support@fintrackplus.in</a>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Upon account deletion, your data will be permanently removed within 30 days.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Children's Privacy</h2>
            <p>The Service is not intended for users under the age of 18. We do not knowingly collect data from minors.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <p><a href="mailto:support@fintrackplus.in" className="text-primary hover:underline">support@fintrackplus.in</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
