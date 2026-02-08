
# Add Automatic Word Capitalization for Mobile Keyboard

## Overview

When typing in text input fields on mobile devices (iOS/Android), the first letter of each word should be automatically capitalized. This improves user experience by reducing manual capitalization when entering names like vendors, projects, categories, and transaction titles.

## Solution

Add the `autocapitalize="words"` attribute to relevant text input fields. This HTML attribute tells mobile browsers to automatically capitalize the first letter of each word as the user types.

### How It Works

The `autocapitalize` attribute has several values:
- `words` - Capitalize the first letter of each word (what we need)
- `sentences` - Capitalize the first letter of each sentence
- `characters` - Capitalize all characters
- `none` / `off` - No automatic capitalization

---

## Files to Update

### 1. Input Component (`src/components/ui/input.tsx`)

Add a default `autocapitalize="words"` to the base Input component. This will apply to all inputs using this component unless explicitly overridden.

```tsx
// Add autocapitalize="words" as default
<input
  type={type}
  autoCapitalize="words"
  className={...}
  ref={ref}
  {...props}
/>
```

Note: For number, email, and password type inputs, browsers automatically ignore autocapitalize.

### 2. AddTransactionSheet (`src/components/AddTransactionSheet.tsx`)

Add `autoCapitalize="words"` to inline input elements that don't use the Input component:
- Magic fill input (line 310)
- Vendor search input (line 485)
- Any native `<input>` elements for text entry

### 3. Settings Forms

The Input component change will automatically apply to:
- **VendorsSection**: Vendor name input
- **ProjectsSection**: Project name, description inputs
- **CategoriesSection**: Category name input

---

## Technical Details

| File | Changes |
|------|---------|
| `src/components/ui/input.tsx` | Add `autoCapitalize="words"` as default prop |
| `src/components/AddTransactionSheet.tsx` | Add `autoCapitalize="words"` to inline inputs |

---

## Expected Behavior

After implementation:
- When typing "john doe" in a vendor field, it auto-capitalizes to "John Doe"
- Project names like "new project" become "New Project" automatically
- Transaction titles follow the same pattern
- Works on both iOS Safari and Android Chrome keyboards
- Desktop browsers are unaffected (attribute is ignored)
