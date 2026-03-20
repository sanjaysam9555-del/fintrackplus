

## Sync Display Pictures Across All Components

### Problem
Several components display partner/team member avatars using only colored initials (first letter), completely ignoring the `avatarUrl` property that's already available on partner objects. The `userProfile.avatar` and `partner.avatarUrl` data is correctly synced in the store — the issue is purely in the rendering code.

### Components Missing Avatar Images

| Component | Location | Issue |
|---|---|---|
| `PartnerBalanceCard.tsx` | Partner rows (line 109-112) | Shows colored initial, ignores `partner.avatarUrl` |
| `PartnerTransferSheet.tsx` | From/To visual (lines 131-135, 149-153) | Shows colored initial, ignores `avatarUrl` |
| `PartnerTransferSheet.tsx` | From partner selected (lines 172-177) | Shows colored initial, ignores `avatarUrl` |
| `PartnerTransferSheet.tsx` | From partner list items (lines 201-206) | Shows colored initial, ignores `avatarUrl` |
| `PartnerTransferSheet.tsx` | To partner selected (lines 223-228) | Shows colored initial, ignores `avatarUrl` |
| `PartnerTransferSheet.tsx` | To partner list items (lines 252-257) | Shows colored initial, ignores `avatarUrl` |
| `PartnerDetailSheet.tsx` | Header (lines 101-106) | Shows colored initial, ignores `partner.avatarUrl` |

### Fix
In each location, replace the colored-initial `<div>` with a conditional: if `avatarUrl` exists, render an `<img>`, otherwise fall back to the existing colored initial. Pattern:

```tsx
{partner.avatarUrl ? (
  <img src={partner.avatarUrl} alt={partner.name} className="w-8 h-8 rounded-full object-cover" />
) : (
  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
    style={{ backgroundColor: partner.color }}>
    {partner.name.charAt(0).toUpperCase()}
  </div>
)}
```

### Files to modify
| File | Change |
|---|---|
| `src/components/PartnerBalanceCard.tsx` | Add avatar image check for partner rows |
| `src/components/PartnerTransferSheet.tsx` | Add avatar image check in 6 locations (from/to visual, selected, list items) |
| `src/components/settings/PartnerDetailSheet.tsx` | Add avatar image check in header |

