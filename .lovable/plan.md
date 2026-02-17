

# Add Transfer Between Partners Button to Partners Page

The "Transfer Between Partners" button and its associated `PartnerTransferSheet` modal need to be added to the Partners settings page (`PartnersSection`), where it logically belongs.

## Changes

### `src/components/settings/PartnersSection.tsx`

1. Import `PartnerTransferSheet` and `ArrowLeftRight` icon
2. Add state for `showTransferSheet`
3. Render a "Transfer Between Partners" button after the partner list (before the "Add Partner" button), visible only when 2+ partners exist
4. Render the `PartnerTransferSheet` component at the bottom

The button will use the same styling pattern as in the `PartnerBalanceCard` -- an outline button with the `ArrowLeftRight` icon.

| File | Change |
|------|--------|
| `src/components/settings/PartnersSection.tsx` | Add transfer button and `PartnerTransferSheet` after partner list, before "Add Partner" button |

No other files need changes. The `PartnerTransferSheet` component is already fully implemented and just needs to be wired in.

