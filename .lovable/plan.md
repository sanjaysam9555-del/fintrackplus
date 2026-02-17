

# Redesign Project Cards for Better Readability

## Current Problems

- The project name, description, labels, and 3 action buttons (archive, edit, delete) are all squeezed into a single horizontal row, making it cramped on mobile
- Financial data (Spent vs Internal Cost) uses tiny, same-weight text that's hard to scan
- No visual separation between the project identity, financial summary, and actions
- The margin (Client Cost - Internal Cost) isn't shown on the card at all, despite being a key metric

## New Card Layout

Each project card will be restructured into clear vertical sections:

```text
+------------------------------------------+
| [Icon]  Project Name            [...menu]|
|         Description text                 |
|         #wedding  #corporate             |
+------------------------------------------+
|  Spent        Budget       Margin        |
|  ₹45,000      ₹1,00,000   ₹55,000       |
|  [===progress bar==================]     |
+------------------------------------------+
```

Key changes:

1. **Collapse 3 action buttons into a single "..." overflow menu** -- Archive, Edit, Delete move into a dropdown, decluttering the card
2. **Add a 3-column financial summary row** showing Spent, Budget (Internal Cost), and Margin side by side with clear labels and color-coded values (green for positive margin, red for negative/over-budget)
3. **Give the project name more prominence** -- slightly larger font weight
4. **Move labels below description** with a small gap for breathing room
5. **Client Cost displayed** as the Margin calculation (Client Cost - Internal Cost) directly on the card

## Technical Changes

### `src/components/settings/ProjectsSection.tsx`

- Import `DropdownMenu` components from `@radix-ui/react-dropdown-menu` (already available via `src/components/ui/dropdown-menu.tsx`) and `MoreVertical` icon from lucide
- Replace the 3 inline action buttons with a single `DropdownMenu` containing Archive, Edit, and Delete options
- Restructure the card body into:
  - **Header row**: Icon + Name + overflow menu
  - **Description**: Below header, if present
  - **Labels**: Below description, if present  
  - **Financial grid**: 3-column grid showing Spent / Budget / Margin with the progress bar underneath
- Show the Margin value (clientCost - internalCost) on the card when clientCost > 0
- Show financial section when either internalCost or clientCost is greater than 0

No other files need changes.
