import { icons, LucideIcon } from 'lucide-react';

// Map short icon IDs (stored in DB) to actual Lucide icon names (PascalCase)
const ICON_ID_TO_LUCIDE: Record<string, string> = {
  shopping: 'ShoppingBag',
  food: 'Utensils',
  transport: 'Car',
  bills: 'Zap',
  entertainment: 'Film',
  health: 'Stethoscope',
  education: 'GraduationCap',
  travel: 'Plane',
  salary: 'Wallet',
  investment: 'TrendingUp',
  freelance: 'Briefcase',
  gift: 'Gift',
  home: 'Home',
  coffee: 'Coffee',
  other: 'MoreHorizontal',
};

/**
 * Get the Lucide icon component for a given icon name
 * Handles both short IDs (e.g., 'shopping') and Lucide names (e.g., 'ShoppingBag')
 */
export const getIconComponent = (iconName: string): LucideIcon => {
  // First check the mapping for short IDs
  const mappedName = ICON_ID_TO_LUCIDE[iconName];
  if (mappedName && icons[mappedName as keyof typeof icons]) {
    return icons[mappedName as keyof typeof icons] as LucideIcon;
  }
  
  // Try PascalCase version
  const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  if (icons[pascalCase as keyof typeof icons]) {
    return icons[pascalCase as keyof typeof icons] as LucideIcon;
  }
  
  // Try direct lookup
  if (icons[iconName as keyof typeof icons]) {
    return icons[iconName as keyof typeof icons] as LucideIcon;
  }
  
  // Fallback to Circle
  return icons.Circle as LucideIcon;
};

/**
 * Render a category icon with consistent styling
 */
export const renderCategoryIcon = (iconName: string, color: string, size: number = 14) => {
  const IconComponent = getIconComponent(iconName);
  return <IconComponent size={size} style={{ color }} />;
};

/**
 * Render a vendor icon with consistent styling
 */
export const renderVendorIcon = (iconName: string | undefined, color: string, size: number = 14) => {
  const name = iconName || 'Store';
  const IconComponent = getIconComponent(name);
  return <IconComponent size={size} style={{ color }} />;
};
