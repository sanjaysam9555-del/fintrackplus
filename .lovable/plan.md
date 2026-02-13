

# Landing Page for FinTrack+ -- Built for Indian Wedding Planners

## Audience and Positioning

This is not a generic finance app. FinTrack+ is purpose-built for Indian wedding planners who juggle lakhs in cash and online payments across multiple weddings, dozens of vendors (florists, caterers, decorators, photographers), and partner teams -- all while needing GST compliance and CA-ready books.

## Page Structure (Route: `/landing`, publicly accessible)

### Section 1: Hero
- Headline: "Stop Losing Money Between Weddings"
- Subheadline: "The finance app Indian wedding planners actually need. Track every rupee across events, vendors, and partners -- even offline."
- CTA: "Start Free" (links to `/auth`)
- Visual: Phone mockup showing the Dashboard with INR amounts, partner balances, and project cards

### Section 2: Pain Points (Problem Statement)
A 3-card grid addressing real wedding planner pain points:
1. **"Cash leaks between events"** -- Vendors get paid in cash, amounts get lost in WhatsApp messages and notebooks
2. **"No visibility into margins"** -- You quoted the client 18L but spent 14L or 20L? You only find out after the wedding
3. **"GST and CA headaches"** -- Receipts scattered across phones, no clean books when tax season arrives

### Section 3: Feature Showcase (Solutions Grid)
A detailed section with ~8 feature cards, each with icon, title, description, and a relevant detail:

1. **Wedding-as-a-Project** -- Create a project per wedding (e.g., "Sharma-Gupta Wedding"). Set Internal Cost (your actual spend) and Client Cost (what you charge). See real-time margin, health status (Healthy/At-Risk/Critical), and a progress bar showing budget consumption. Duplicate projects to reuse templates.

2. **Vendor Management** -- Maintain a vendor directory with custom icons and colors. See total spend per vendor across all weddings. Track which vendor got paid for which event. Expandable vendor cards with full transaction history.

3. **Partner/Team Tracking** -- Add business partners with separate Cash and Online opening balances. Track who handled which transaction. See per-partner closing balances (Cash + Online split). One-tap partner-to-partner fund transfers.

4. **Part Payment / Installment Tracking** -- Wedding vendors rarely get paid in one shot. Log the total expected amount, plan future installments with dates, confirm payments as they happen. Visual progress bar shows how much is paid vs remaining.

5. **Cash vs Online Split** -- Every transaction is tagged Cash or Online. Dashboard and partner balances reflect both modes separately. Essential for wedding planners who handle lakhs in cash daily.

6. **GST Tagging and CA Export** -- Tag any transaction as GST. Export a CA-ready ZIP package: transaction CSV, GST summary CSV, and a folder of receipt images. Professional report headers with your name and date range.

7. **Receipt Capture** -- Attach photos of bills and receipts directly to transactions. Camera + gallery support on mobile. Images are compressed and stored securely. Included in CA export packages.

8. **Smart Insights (AI Summary)** -- FY-level hero card with total income/expense. 6-month spending trend chart. Category-wise breakdown pie chart. Project health dashboard. Cash vs Online payment split. Auto-generated insights (top spending categories, budget warnings).

### Section 4: More Features (Secondary Grid)
A compact grid of additional features:
- **Indian Financial Year** -- All summaries default to Apr-Mar FY, not calendar year
- **Recurring Transactions** -- Set up monthly rent, EMIs, or retainer fees (daily/weekly/monthly/yearly)
- **Duplicate Detection** -- Smart warnings when you accidentally enter the same vendor + amount + date
- **Offline-First Sync** -- Works without internet. Queues changes locally, syncs when back online. Pending count visible on dashboard
- **Global Search** -- Cmd+K to search across all transactions, vendors, projects instantly
- **Undo Delete** -- 5-second undo toast on every deletion. No accidental data loss
- **Custom Categories** -- Create expense and income categories with icons and colors tailored to wedding planning (Decor, Catering, Venue, Photography, etc.)
- **Dark Mode + OLED** -- Easy on the eyes during late-night event planning

### Section 5: How It Works
3-step flow:
1. **Sign up in 30 seconds** -- Email + password, no credit card
2. **Create your first wedding project** -- Set the client name, your budget, and client cost
3. **Start logging** -- Every vendor payment, every cash handoff, every receipt

### Section 6: Who Is This For?
Persona cards:
- Solo wedding planners managing 5-15 events/year
- Wedding planning agencies with 2-5 partners handling different events
- Event coordinators who need to report clean books to clients

### Section 7: FAQ (Accordion)
- "Can I use this for non-wedding events?" -- Yes, projects work for any event
- "Is my data safe?" -- Cloud-synced with secure authentication
- "Does it work offline?" -- Yes, fully offline-first with background sync
- "Can my business partner access the same data?" -- Currently single-user with partner tracking. Multi-user access coming soon
- "Is it free?" -- Free to start, premium features coming soon

### Section 8: Final CTA
- "Your next wedding deserves better books."
- Large "Get Started Free" button

### Section 9: Footer
- FinTrack+ branding with version
- Links: Privacy, Terms, Contact

---

## Technical Implementation

### New Files
- `src/pages/Landing.tsx` -- Main landing page component (~600 lines)
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/PainPointsSection.tsx`
- `src/components/landing/FeaturesGrid.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/PersonaSection.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/landing/Footer.tsx`

### Modified Files
- `src/App.tsx` -- Add `/landing` route (publicly accessible, no auth required)

### Design Approach
- Framer Motion scroll-triggered animations (fade-in-up on each section)
- Glass-morphism cards consistent with existing app design
- Responsive: mobile-first, scales to desktop with multi-column grids
- Color palette: existing app theme (primary blue, emerald for success, amber for warnings)
- INR currency throughout (₹) -- no dollar signs anywhere
- Uses existing UI components (Card, Accordion, Button, Badge) for consistency
- No placeholder images initially -- uses Lucide icons and gradient backgrounds for feature cards

