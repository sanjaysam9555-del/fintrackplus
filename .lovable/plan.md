

## Add Missing Features to Landing Page

### Summary
Update the landing page to showcase all features built over the past month that are currently missing. This involves updating existing sections and adding new content across 4 files.

### Missing Features to Add

1. **Organisation Branding** -- custom name/logo
2. **Self-Transfers** (Cash to Online within same partner)
3. **Company Bank Account** (shared org funds)
4. **Partner/Company Transfers** (deposit/withdraw from company account)
5. **Team Management** (roles, access control)
6. **Change Approval Workflow** (edit/delete approvals)
7. **Onboarding Flow** (guided setup)
8. **Backup & Restore** (automated snapshots)
9. **Financial Holdings** (consolidated view)
10. **Installment & Recurring Reminders** (notifications/alerts)
11. **Desktop Sidebar Layout**
12. **Default Time Frame** (user preference)

### Plan

#### 1. Update `ComparisonSection.tsx` -- add new rows
Add these rows to the spreadsheet comparison table:
- Team roles & access control
- Edit/delete approval workflow
- Company bank account tracking
- Automated backup & restore
- Internal fund transfers (self/partner)

#### 2. Update `ChaosToClarity.tsx` -- add 2 new before/after rows
- **Team Access**: "Anyone can edit or delete entries..." vs "Role-based access with mandatory approvals for edits/deletes"
- **Company Funds**: "Company bank account mixed with personal..." vs "Dedicated Company Bank Account with deposit/withdrawal tracking"

#### 3. Update `FeaturesGrid.tsx` -- add to existing grids

**Add to `showcaseFeatures`** (big phone-mockup showcase):
- **Team & Governance**: Team roles + change approval workflow. Use placeholder image.

**Add to `remainingFeatures`** (card grid with screenshots):
- **Company Bank Account**: Shared org funds with deposit/withdrawal tracking. Placeholder image.
- **Financial Holdings**: Consolidated cash/online balances across all partners. Placeholder image.

**Add to `secondaryFeatures`** (medium cards with screenshots):
- **Backup & Restore**: Automated twice-daily snapshots with one-tap restore. Placeholder image.
- **Organisation Branding**: Custom name and logo across the app. Placeholder image.
- **Onboarding Flow**: Guided setup wizard for new users. Placeholder image.

**Add to `extraFeatures`** (compact icon-only cards):
- Self-Transfers (Cash to Online)
- Partner/Company Transfers
- Installment Reminders
- Default Time Frame setting
- Desktop Sidebar

#### 4. Add placeholder image
Create a simple placeholder file at `src/assets/landing/real/placeholder-feature.png` -- use the existing `public/placeholder.svg` as the import for now until real screenshots are provided.

### Files Changed
| File | Change |
|---|---|
| `src/components/landing/ComparisonSection.tsx` | Add 5 new comparison rows |
| `src/components/landing/ChaosToClarity.tsx` | Add 2 new before/after rows |
| `src/components/landing/FeaturesGrid.tsx` | Add features to all 4 feature arrays + import placeholder |
| No new files needed | Use `/placeholder.svg` for missing screenshots |

