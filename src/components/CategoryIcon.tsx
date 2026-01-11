import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CategoryIconProps {
  iconName: string;
  colorClass: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Utensils: Icons.Utensils,
  Car: Icons.Car,
  ShoppingBag: Icons.ShoppingBag,
  Film: Icons.Film,
  Zap: Icons.Zap,
  Heart: Icons.Heart,
  Plane: Icons.Plane,
  ShoppingCart: Icons.ShoppingCart,
  Smartphone: Icons.Smartphone,
  Code: Icons.Code,
  MoreHorizontal: Icons.MoreHorizontal,
  Wallet: Icons.Wallet,
  Briefcase: Icons.Briefcase,
  TrendingUp: Icons.TrendingUp,
  Wrench: Icons.Wrench,
  Coffee: Icons.Coffee,
  Home: Icons.Home,
  DollarSign: Icons.DollarSign,
  CreditCard: Icons.CreditCard,
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
  const Icon = iconMap[iconName] || Icons.Circle;
  
  return (
    <div className={cn(
      "rounded-xl flex items-center justify-center",
      sizeClasses[size],
      colorClass,
      className
    )}>
      <Icon size={iconSizes[size]} className="text-white" />
    </div>
  );
};
