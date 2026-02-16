
# Fix: Installment Confirmation with Payment Method Selection

## Problem
When confirming an installment as received, the system always copies the **parent transaction's payment method** (e.g., cash). In reality, different installments may be received via different methods -- installment 2 might come in cash while installment 3 arrives online. The current flow has no way to specify this, leading to inaccurate cash vs. online balance tracking.

## Solution
Add a **confirmation step** before marking an installment as received. Instead of immediately confirming, the user sees a small inline form where they can choose the payment method (cash / online) and optionally change the partner. This applies everywhere installments are confirmed: the Dashboard reminder dialog, the Part Payment Tracker, and the Installment Row component.

## Changes

### 1. Update store: `confirmInstallment` accepts payment method override
**File:** `src/lib/store.ts`
- Add an optional `overrides` parameter to `confirmInstallment`: `{ paymentMethod?: PaymentMethod, partnerId?: string }`
- Use `overrides.paymentMethod ?? parent.paymentMethod` when creating the linked transaction
- Same for `partnerId`

### 2. Create a reusable confirmation mini-form component
**File:** `src/components/InstallmentConfirmForm.tsx` (new)
- Small inline card that appears when user taps "Confirm" / "Received"
- Shows:
  - Payment method toggle: Cash / Online (radio buttons, defaulting to parent's method)
  - Partner selector dropdown (optional, defaults to parent's partner)
  - "Confirm Payment" button and "Cancel" link
- Calls `confirmInstallment` with the chosen overrides

### 3. Update InstallmentDueReminder dialog
**File:** `src/components/InstallmentDueReminder.tsx`
- Replace the one-click "Received" button with a two-step flow:
  - First tap: expand the installment card to show the `InstallmentConfirmForm`
  - Second tap: confirm with chosen payment method

### 4. Update PartPaymentTracker
**File:** `src/components/PartPaymentTracker.tsx`
- Same two-step flow for the "Confirm" button on pending installments
- Show `InstallmentConfirmForm` inline when user clicks "Confirm"

### 5. Update InstallmentRow
**File:** `src/components/InstallmentRow.tsx`
- When `showConfirmButton` is true, clicking "Confirm Payment Received" expands the `InstallmentConfirmForm` instead of immediately confirming

## Technical Details

**Store signature change:**
```
confirmInstallment(
  parentTransactionId: string,
  installmentId: string,
  userId?: string,
  overrides?: { paymentMethod?: PaymentMethod; partnerId?: string }
)
```

**InstallmentConfirmForm props:**
```
interface InstallmentConfirmFormProps {
  defaultPaymentMethod: PaymentMethod;
  defaultPartnerId?: string;
  amount: number;
  onConfirm: (paymentMethod: PaymentMethod, partnerId?: string) => void;
  onCancel: () => void;
}
```

The form uses the existing `RadioGroup` component for cash/online selection and a simple `Select` dropdown for partners (populated from the store's partners list). It's compact enough to render inline within cards without opening a separate dialog.

## Files Summary

| File | Action |
|------|--------|
| `src/lib/store.ts` | Modify `confirmInstallment` to accept overrides |
| `src/components/InstallmentConfirmForm.tsx` | Create new reusable form component |
| `src/components/InstallmentDueReminder.tsx` | Use two-step confirm flow |
| `src/components/PartPaymentTracker.tsx` | Use two-step confirm flow |
| `src/components/InstallmentRow.tsx` | Use two-step confirm flow |
