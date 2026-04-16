

## Add Refund Policy Page & Footer Link

### Changes

#### 1. Create `src/pages/Refund.tsx`
New page following the same layout pattern as `Privacy.tsx` and `Terms.tsx` — back button, app icon, heading, and content sections covering refund/cancellation terms for FinTrack⁺.

#### 2. Update `src/App.tsx`
- Add lazy import for the Refund page
- Add `<Route path="/refund" element={<Refund />} />` in all three route groups (matching where `/privacy` and `/terms` appear)

#### 3. Update `src/components/landing/LandingFooter.tsx`
- Add a "Refund" link between "Terms" and "Contact" in the footer links section

| File | Change |
|---|---|
| `src/pages/Refund.tsx` | New refund policy page |
| `src/App.tsx` | Add lazy import + 3 route entries |
| `src/components/landing/LandingFooter.tsx` | Add "Refund" link |

