

# Fix: iPhone Safe Area on All Settings Sub-Pages

## Problem
When opening Partners, Vendors, Categories, Projects, Reports, or Activity Logs from Settings, the header content is cut off behind the iPhone status bar/Dynamic Island. The `safe-top` class is missing from these sub-page headers.

## Root Cause
The settings sub-sections render their own full-page layouts with headers that don't include the `safe-top` utility. Some use `sticky top-0` (which pins to the very top edge behind the notch) and others use `p-4 pt-6` (fixed 24px, not enough for notch devices).

## Fix -- Add `safe-top` to All Sub-Page Headers

| File | Current | Fix |
|------|---------|-----|
| `src/components/settings/PartnersSection.tsx` (line ~348) | `p-4 pt-6` | `p-4 safe-top` |
| `src/components/settings/CategoriesSection.tsx` (line ~95) | `sticky top-0 ... p-4` | `sticky top-0 ... p-4 safe-top` |
| `src/components/settings/ProjectsSection.tsx` (line ~168) | `sticky top-0 ... p-4` | `sticky top-0 ... p-4 safe-top` |
| `src/components/settings/VendorsSection.tsx` (line ~279) | `sticky top-0 ... p-4` (detail view) | `sticky top-0 ... p-4 safe-top` |
| `src/components/settings/VendorsSection.tsx` (line ~371) | `sticky top-0 ... p-4` (list view) | `sticky top-0 ... p-4 safe-top` |
| `src/components/settings/ReportsSection.tsx` (line ~471) | `sticky top-0 ... p-4` | `sticky top-0 ... p-4 safe-top` |
| `src/components/SettingsPage.tsx` (line ~330) | `p-4 pt-6` (Activity Logs) | `p-4 safe-top` |
| `src/components/SettingsPage.tsx` (line ~346) | `p-4 pt-6 safe-top` | `p-4 safe-top` (remove conflicting `pt-6`) |
| `src/components/NotificationsPage.tsx` (line ~61) | `p-4 pt-6` | `p-4 safe-top` |
| `src/components/AISummaryPage.tsx` (line ~203) | `p-4 pt-6 safe-top` | `p-4 safe-top` (remove conflicting `pt-6`) |
| `src/components/TransactionList.tsx` (line ~285) | `p-4 pt-6 safe-top` | `p-4 safe-top` (remove conflicting `pt-6`) |

## Summary
- Add `safe-top` to 6 settings sub-pages that are missing it entirely
- Remove conflicting `pt-6` from 3 pages that already have `safe-top` but where `pt-6` overrides it
- This ensures every page header respects the iPhone notch/Dynamic Island safe area

## Files Changed
- `src/components/settings/PartnersSection.tsx`
- `src/components/settings/CategoriesSection.tsx`
- `src/components/settings/ProjectsSection.tsx`
- `src/components/settings/VendorsSection.tsx`
- `src/components/settings/ReportsSection.tsx`
- `src/components/SettingsPage.tsx`
- `src/components/NotificationsPage.tsx`
- `src/components/AISummaryPage.tsx`
- `src/components/TransactionList.tsx`
