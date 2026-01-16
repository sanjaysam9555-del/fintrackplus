import { cn } from "@/lib/utils";
import { icons, LucideIcon } from "lucide-react";

interface CategoryIconProps {
  iconName: string;
  colorClass: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

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

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
};

export const CategoryIcon = ({ iconName, colorClass, size = "md", className }: CategoryIconProps) => {
  // First check mapping, then try direct lookup, then fallback to Circle
  const lucideName = ICON_ID_TO_LUCIDE[iconName] || iconName;
  const Icon: LucideIcon = (icons[lucideName as keyof typeof icons] as LucideIcon) || icons.Circle;
  
  // Check if colorClass is a hex color
  const isHexColor = colorClass?.startsWith('#');
  
  return (
    <div 
      className={cn(
        "rounded-xl flex items-center justify-center",
        sizeClasses[size],
        !isHexColor && colorClass,
        className
      )}
      style={isHexColor ? { backgroundColor: colorClass } : undefined}
    >
      <Icon size={iconSizes[size]} className="text-white" />
    </div>
  );
};
