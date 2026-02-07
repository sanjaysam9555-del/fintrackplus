

# Optimize Text Sizing for Mobile Project Detail View

## Problem Summary

The transaction entries and content in the Project Detail Sheet use the same sizing as the main dashboard, which wastes valuable screen space on mobile. Users cannot see maximum information in a single view because:

1. **Transaction items** have large padding (`p-3`) and standard text sizes
2. **Section headers** use large icons and spacing
3. **Financial summary cards** have generous padding that could be reduced
4. **Vendor rows** use the same spacing as standalone cards

As shown in the screenshot, entries like "Sajjan Singh Dholi - ₹11,000" take up significant vertical space, limiting how many transactions are visible before scrolling.

## Solution

Implement a **compact display mode** for the Project Detail Sheet that optimizes text sizes and spacing for mobile, allowing more information to be visible at once.

---

## Technical Changes

### File 1: `src/components/TransactionItem.tsx`

**Add a `compact` prop** to enable a space-efficient display mode:

```tsx
interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onClick?: () => void;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
  compact?: boolean; // NEW PROP
}
```

**Apply compact styling when enabled:**

| Element | Standard | Compact |
|---------|----------|---------|
| Main row padding | `p-3` | `p-2` |
| Category icon | 40x40px | 32x32px |
| Title text | `font-semibold` (base) | `text-sm font-medium` |
| Subtitle text | `text-sm` | `text-xs` |
| Amount text | `font-bold` (base) | `text-sm font-bold` |
| Gap between items | `gap-3` | `gap-2` |
| Chevron icon | 16px | 14px |

**Conditional styling example:**
```tsx
<div
  onClick={() => setIsExpanded(!isExpanded)}
  className={cn(
    "flex items-center cursor-pointer hover:bg-muted/30 transition-colors",
    compact ? "gap-2 p-2" : "gap-3 p-3"
  )}
>
  {/* CategoryIcon with size prop */}
  <CategoryIcon 
    iconName={category?.icon || 'Circle'} 
    colorClass={category?.color || 'category-other'}
    size={compact ? "sm" : "default"}
  />
  
  <div className="flex-1 min-w-0">
    <p className={cn(
      "truncate",
      compact ? "text-sm font-medium" : "font-semibold"
    )}>
      {transaction.title || transaction.vendor || category?.name || 'Transaction'}
    </p>
    <p className={cn(
      "text-muted-foreground truncate",
      compact ? "text-xs" : "text-sm"
    )}>
      {/* subtitle content */}
    </p>
  </div>
  
  <p className={cn(
    "font-bold text-right whitespace-nowrap",
    compact ? "text-sm" : "",
    isExpense ? "text-destructive" : "text-success"
  )}>
    {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
  </p>
</div>
```

---

### File 2: `src/components/CategoryIcon.tsx`

**Add size variant support:**

```tsx
interface CategoryIconProps {
  iconName: string;
  colorClass: string;
  size?: "sm" | "default";  // NEW PROP
}

export const CategoryIcon = ({ iconName, colorClass, size = "default" }: CategoryIconProps) => {
  const IconComponent = getIconComponent(iconName);
  
  const sizeClasses = size === "sm" 
    ? "w-8 h-8"   // 32px
    : "w-10 h-10"; // 40px
    
  const iconSize = size === "sm" ? 16 : 20;
  
  return (
    <div className={cn(sizeClasses, "rounded-xl flex items-center justify-center", colorClass)}>
      <IconComponent size={iconSize} className="text-white" />
    </div>
  );
};
```

---

### File 3: `src/components/ProjectDetailSheet.tsx`

**Apply compact styling throughout:**

**1. Reduce section spacing** (line 162):
```tsx
// Before
<div className="p-4 space-y-6 w-full min-w-0">

// After
<div className="p-3 space-y-4 w-full min-w-0">
```

**2. Compact financial summary grid** (lines 164-189):
```tsx
// Before
<div className="grid grid-cols-2 gap-3 w-full">
  <div className="bg-muted/50 rounded-xl p-3 overflow-hidden">
    <p className="text-xs text-muted-foreground">Budget</p>
    <p className="text-lg font-bold truncate">₹{project.budgetLimit.toLocaleString()}</p>
  </div>
  ...

// After
<div className="grid grid-cols-2 gap-2 w-full">
  <div className="bg-muted/50 rounded-lg p-2 overflow-hidden">
    <p className="text-[10px] text-muted-foreground">Budget</p>
    <p className="text-base font-bold truncate">₹{project.budgetLimit.toLocaleString()}</p>
  </div>
  ...
```

**3. Smaller section headers** (lines 234-236, 255-257):
```tsx
// Before
<h3 className="font-semibold mb-3 flex items-center gap-2">
  <ArrowDown size={18} className="text-green-500" />
  Income Entries ({incomeTransactions.length})
</h3>

// After
<h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
  <ArrowDown size={14} className="text-green-500" />
  Income Entries ({incomeTransactions.length})
</h3>
```

**4. Reduce transaction list spacing** (lines 238, 259):
```tsx
// Before
<div className="space-y-2 w-full overflow-hidden">

// After
<div className="space-y-1.5 w-full overflow-hidden">
```

**5. Pass compact prop to TransactionItem** (lines 240-246, 260-266):
```tsx
<TransactionItem
  key={transaction.id}
  transaction={transaction}
  category={getCategoryById(transaction.categoryId)}
  userId={userId}
  onEditSheetChange={onEditSheetChange}
  compact  // NEW PROP
/>
```

**6. Compact vendor breakdown rows** (lines 291-315):
```tsx
// Before
<motion.div className="w-full bg-muted/50 rounded-xl p-3 cursor-pointer...">

// After  
<motion.div className="w-full bg-muted/50 rounded-lg p-2 cursor-pointer...">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5 min-w-0 flex-1">
      <ChevronDown size={14} className="..." />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-left truncate">{item.vendor}</p>
        <p className="text-[10px] text-muted-foreground text-left">...</p>
      </div>
    </div>
    <p className="text-sm font-semibold shrink-0">₹{item.amount.toLocaleString()}</p>
  </div>
</motion.div>
```

**7. Compact notes section** (lines 223-228):
```tsx
// Before
<Textarea className="min-h-[100px] resize-none" />

// After
<Textarea className="min-h-[80px] resize-none text-sm" />
```

---

## Visual Comparison

```
BEFORE (standard sizing):              AFTER (compact mode):
+--------------------------------+     +--------------------------------+
| [ICON] Sajjan Singh Dholi      |     | [sm] Sajjan Singh Dholi        |
|        Vendor Payment • 2:18   |     |      Vendor Payment • 2:18 -₹11k
|                      -₹11,000  |     +--------------------------------+
+--------------------------------+     | [sm] Pardeep Safa Milni        |
| [ICON] Pardeep Safa Milni      |     |      Vendor Payment • 2:14 -₹38k
|        Vendor Payment • 2:14   |     +--------------------------------+
|                      -₹38,000  |     | [sm] Bouncers Balance          |
+--------------------------------+     |      Vendor Payment • 2:16 -₹22k
| [ICON] Bouncers Balance        |     +--------------------------------+
|        Vendor Payment • 2:16   |     | [sm] Anchor Pratham 2nd        |
|                      -₹22,000  |     |      RJ Deeksha • 6:09   -₹20k |
+--------------------------------+     +--------------------------------+

~3 items visible                       ~5-6 items visible
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/TransactionItem.tsx` | Add `compact` prop with smaller sizing |
| `src/components/CategoryIcon.tsx` | Add `size` prop for sm/default variants |
| `src/components/ProjectDetailSheet.tsx` | Apply compact styling, pass `compact` to TransactionItem |

---

## Expected Result

After these changes:
- **40-50% more transactions visible** per screen on mobile
- Cleaner, more information-dense layout
- No horizontal clipping
- Content remains readable and touch-friendly
- Main dashboard transaction list remains unchanged (compact is opt-in)

