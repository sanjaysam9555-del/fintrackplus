

## Improve Activity Logs — Make Every Action Distinctly Clear

### Current State
Most actions are already logged, but several have vague or missing details. The user wants every log entry to be self-explanatory at a glance.

### Issues Found

| Action | Current Status | Problem |
|--------|---------------|---------|
| Profile name change | Logged as generic "Profile Updated" | No details about what changed |
| Display picture change | Lumped into "Profile Updated" | Not distinctly tracked |
| Partner Transfer | Logged but **no details** | Missing amount, from/to, payment method |
| CSV Export | Logged but no details | Missing time period info |
| CA Package Export | Logged but no details | Missing time period info |
| PDF Report | Logged but no details | Missing time period info |
| Partner avatar change | Not logged at all | Silent action |
| Theme change | Already good | No change needed |
| All CRUD (transactions, projects, vendors, categories, labels, partners) | Already good with details | No change needed |

### Changes

**`src/lib/store.ts`** — `updateUserProfile`
- Detect what changed (name vs avatar) and log distinct notifications:
  - "Name Changed" with before/after details
  - "Profile Photo Updated" as a distinct entry
- Currently it fires one generic "Profile Updated" with no details

**`src/lib/store.ts`** — `addPartnerTransfer`
- Add `details` array to the notification with: Amount, From partner, To partner, Payment Method, Date

**`src/components/settings/ReportsSection.tsx`** — all 3 export notifications
- Add `details` to CSV export: time period, transaction count
- Add `details` to CA Package export: time period, transaction count
- Add `details` to PDF Report: time period, transaction count

**`src/components/settings/PartnersSection.tsx`** — partner avatar upload
- After successful avatar upload, fire a notification: "Partner Photo Updated" with partner name

**`src/components/ProfileEditSheet.tsx`** — avatar upload
- After successful avatar upload, fire a distinct "Profile Photo Changed" notification (instead of relying on the generic `updateUserProfile` one)

### Files to change
| File | What |
|------|------|
| `src/lib/store.ts` | Enrich updateUserProfile and addPartnerTransfer notifications with details |
| `src/components/settings/ReportsSection.tsx` | Add details to all 3 export notifications |
| `src/components/ProfileEditSheet.tsx` | Add distinct "Profile Photo Changed" notification on avatar upload |
| `src/components/settings/PartnersSection.tsx` | Add notification when partner avatar is changed |

