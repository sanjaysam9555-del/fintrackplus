

# Revamp Projects Tab UI & Unify Search Behavior

## Overview

This plan addresses two issues:
1. The Projects tab UI feels underwhelming compared to other pages
2. Search bars in the Expenses/Income tabs should open the global search dialog instead of filtering locally

---

## Part 1: Projects Tab UI Improvements

### Current Issues
- Plain header with just "Projects" text
- Summary card lacks visual polish
- Project cards are dense without visual breathing room
- No search functionality
- Toggle tabs look basic

### Proposed Changes

| Element | Current | Proposed |
|---------|---------|----------|
| Header | Plain "Projects" text | Icon + title + subtitle (like AI Summary page) |
| Summary Card | 3-column grid in a box | Enhanced card with better spacing and visual hierarchy |
| Toggle Tabs | Basic buttons | Pill-style segmented control with animation |
| Project Cards | Dense layout | More breathing room, refined typography |
| Search | None | Add search button that opens global search |

### Header Enhancement

```
Current:                    Proposed:
+-------------------+       +-------------------+
| Projects          |       | [icon] Projects   |
+-------------------+       | Track project     |
                            | financials        |
                            +-------------------+
```

### Summary Card Enhancement

```
Current:                        Proposed:
+---------------------------+   +---------------------------+
| [Budget] [Spent] [Margin] |   | Total Portfolio           |
| icons are small           |   | ₹5,00,000 budget         |
+---------------------------+   +---------------------------+
                                | Budget | Spent  | Margin  |
                                | ₹5L    | ₹3.2L  | ₹50K   |
                                +---------------------------+
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ProjectOverviewPage.tsx` | Enhanced header, refined summary card, improved toggle tabs, add search button |

---

## Part 2: Unify Search Bar Behavior

### Current Behavior
- Dashboard: Search icon opens global search dialog (Ctrl+K)
- TransactionList (Expenses/Income): Has inline `<Input>` that filters locally

### Proposed Behavior
All search interactions should open the global search dialog for consistency.

### Changes

**TransactionList.tsx:**
- Replace the local search `<Input>` with a clickable search button/bar
- When clicked, it will trigger the global search dialog
- This requires passing `onSearchClick` prop from Index.tsx

**Index.tsx:**
- Pass `onSearchClick` to `TransactionList` component

**Visual Change:**
```
Current (TransactionList):
+----------------------------------+
| [🔍] Search vendor or category...|  <- Actual input field
+----------------------------------+

Proposed:
+----------------------------------+
| [🔍] Search transactions...  ⌘K |  <- Clickable button that opens dialog
+----------------------------------+
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Pass `onSearchClick` prop to TransactionList |
| `src/components/TransactionList.tsx` | Replace local search input with clickable search button |

---

## Technical Implementation

### ProjectOverviewPage.tsx Changes

**1. Enhanced Header (lines 96-98)**
```tsx
<div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
      <FolderKanban size={20} className="text-primary" />
    </div>
    <div className="flex-1">
      <h1 className="text-xl font-bold">Projects</h1>
      <p className="text-xs text-muted-foreground">Track project financials</p>
    </div>
    {/* Search button */}
    <button 
      onClick={onSearchClick}
      className="p-2 rounded-full hover:bg-muted transition-colors"
      title="Search (⌘K)"
    >
      <Search size={18} className="text-muted-foreground" />
    </button>
  </div>
</div>
```

**2. Summary Card Enhancement (lines 101-127)**
- Add a header row with "Portfolio Overview" title
- Use larger icons with better spacing
- Add subtle dividers between stats

**3. Toggle Tabs Enhancement (lines 129-148)**
- Use a more polished pill-style container
- Add subtle shadow to active state
- Include count badges with better styling

---

### TransactionList.tsx Changes

**1. Add onSearchClick prop to interface (line 17-21)**
```tsx
interface TransactionListProps {
  type: TransactionType;
  userId?: string;
  onEditSheetChange?: (isOpen: boolean) => void;
  onSearchClick?: () => void;  // New prop
}
```

**2. Replace search input with clickable button (lines 413-424)**
```tsx
{/* Search Button - Opens Global Search */}
<div className="px-4 mb-4">
  <button
    onClick={onSearchClick}
    className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
  >
    <Search size={18} />
    <span className="flex-1 text-left text-sm">Search transactions...</span>
    <kbd className="hidden md:inline-flex px-1.5 py-0.5 bg-background rounded text-xs font-mono">⌘K</kbd>
  </button>
</div>
```

**3. Remove local search state**
- Remove `const [searchQuery, setSearchQuery] = useState("");`
- Remove search filtering from `filteredTransactions` useMemo

---

### Index.tsx Changes

**Pass onSearchClick to TransactionList (lines ~170, ~177)**
```tsx
case 'expenses':
  return (
    <TransactionList 
      type="expense" 
      userId={user?.id} 
      onEditSheetChange={setIsEditSheetOpen}
      onSearchClick={handleOpenSearch}  // Add this
    />
  );
case 'income':
  return (
    <TransactionList 
      type="income" 
      userId={user?.id} 
      onEditSheetChange={setIsEditSheetOpen}
      onSearchClick={handleOpenSearch}  // Add this
    />
  );
```

---

## Visual Summary

### Projects Tab Before → After

```
BEFORE:                           AFTER:
+--------------------+            +------------------------+
| Projects           |            | [📁] Projects     [🔍] |
+--------------------+            |  Track project finances|
| +-----------------+|            +------------------------+
| |Budget|Spent|Marg||            |   Portfolio Overview   |
| +-----------------+|            | +----+-----+--------+  |
|                    |            | |Bdgt|Spent| Margin |  |
| [Active][Archived] |            | |₹5L |₹3.2L| ₹50K   |  |
|                    |            | +----+-----+--------+  |
| +----------------+ |            |                        |
| | Project Card   | |            | ●Active (3) ○Archived  |
| | (dense)        | |            |                        |
| +----------------+ |            | +--------------------+ |
+--------------------+            | | Project Card       | |
                                  | | (refined)          | |
                                  | +--------------------+ |
                                  +------------------------+
```

### Transaction List Search Before → After

```
BEFORE:                           AFTER:
+---------------------------+     +---------------------------+
| [🔍] Search vendor or... |     | 🔍 Search transactions ⌘K |
| (input field)            |     | (clickable button)        |
+---------------------------+     +---------------------------+
         ↓                                   ↓
   Filters list locally           Opens Global Search Dialog
```

---

## Summary

| Change | Files Affected |
|--------|----------------|
| Projects header with icon + subtitle + search | `ProjectOverviewPage.tsx` |
| Enhanced summary card | `ProjectOverviewPage.tsx` |
| Polished toggle tabs | `ProjectOverviewPage.tsx` |
| Replace local search with global search button | `TransactionList.tsx` |
| Pass onSearchClick prop | `Index.tsx` |

