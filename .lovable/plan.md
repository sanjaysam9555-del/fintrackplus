
# Fix Project Transactions, Mobile Scrolling, and Splash Screen Duration

## Summary of Changes

Three issues need to be addressed:
1. Project Detail transactions should show the same format as Income/Expense tabs and be editable
2. Last entry on mobile is overlapped by the bottom tab bar
3. Splash screen animation is too brief (currently ~1.3 seconds total)

---

## Issue 1: Use TransactionItem in Project Details

### Current Problem
The Project Detail Sheet displays transactions using custom inline JSX with minimal information:
- Shows only: date, amount, vendor, category badge
- No ability to edit or delete
- Different visual format from Income/Expense tabs

### Solution
Replace the custom transaction rendering with the `TransactionItem` component that is already used in Home, Income, and Expense tabs.

### File: `src/components/ProjectDetailSheet.tsx`

**Changes needed:**

1. Import the `TransactionItem` component
2. Replace the custom inline transaction cards (lines 200-228 for income, 248-276 for expenses) with `TransactionItem`
3. Pass required props: `transaction`, `category`, `userId`, and `onEditSheetChange`
4. Add `onEditSheetChange` prop to the component interface to support edit sheet state tracking

**Before (custom rendering):**
```tsx
<motion.div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
  <div className="flex items-center justify-between">
    <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
    <span>+₹{transaction.amount.toLocaleString()}</span>
  </div>
  <div>{transaction.vendor}</div>
</motion.div>
```

**After (using TransactionItem):**
```tsx
<TransactionItem
  transaction={transaction}
  category={getCategoryById(transaction.categoryId)}
  userId={userId}
  onEditSheetChange={onEditSheetChange}
/>
```

This gives users:
- Swipe-to-delete functionality
- Expandable details view
- Edit and Delete buttons
- Consistent visual styling across the app
- Receipt/GST indicators

---

## Issue 2: Fix Mobile Scrolling - Bottom Padding

### Current Problem
The last transaction is partially covered by the bottom tab bar on mobile devices.

### Analysis
- GlassDock height: ~68px (py-2 + icon/text + pb-safe)
- Current padding: `pb-32` = 128px on mobile
- Safe area: iOS notch devices have additional ~34px safe area at bottom

The issue is that `pb-32` (128px) should theoretically be enough, but there may be inconsistency with the safe area calculation.

### Solution
Increase bottom padding to ensure the last entry is fully visible with ample room above the dock.

**Change from `pb-32` to `pb-40`** (160px) on all main content pages to provide more breathing room.

### Files to Update

| File | Line | Change |
|------|------|--------|
| `src/components/Dashboard.tsx` | 167 | `pb-32 md:pb-8` → `pb-40 md:pb-8` |
| `src/components/TransactionList.tsx` | 214 | `pb-32 md:pb-8` → `pb-40 md:pb-8` |
| `src/components/ProjectOverviewPage.tsx` | 94 | `pb-32 md:pb-8` → `pb-40 md:pb-8` |

---

## Issue 3: Increase Splash Screen Duration

### Current Problem
Splash screen appears for only ~1.3 seconds total:
- 0.5s for logo animation to complete
- 0.8s delay before calling `onComplete`
- Total: ~1.3 seconds

### Solution
Increase the `setTimeout` delay from 800ms to 1500ms for a total display time of ~2 seconds.

### File: `src/components/SplashScreen.tsx`

**Line 30:** Change from:
```tsx
setTimeout(onComplete, 800);
```
To:
```tsx
setTimeout(onComplete, 1500);
```

This makes the splash screen visible for approximately 2 seconds total (0.5s animation + 1.5s hold).

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ProjectDetailSheet.tsx` | Import TransactionItem, add onEditSheetChange prop, replace custom transaction rendering with TransactionItem component |
| `src/components/Dashboard.tsx` | Change `pb-32` to `pb-40` |
| `src/components/TransactionList.tsx` | Change `pb-32` to `pb-40` |
| `src/components/ProjectOverviewPage.tsx` | Change `pb-32` to `pb-40`, pass onEditSheetChange to ProjectDetailSheet |
| `src/components/SplashScreen.tsx` | Change setTimeout from 800 to 1500 |

---

## Result After Changes

1. **Project Transactions**: Will display with full detail (title, amount, vendor, category, date, payment method) and support edit/delete just like Income/Expense tabs

2. **Mobile Scrolling**: 160px bottom padding ensures last entry is clearly visible above the 68px dock + safe area

3. **Splash Screen**: Displays for ~2 seconds, giving users time to see the branding animation
