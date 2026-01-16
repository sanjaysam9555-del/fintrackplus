import { cn } from "@/lib/utils";
import { icons, LucideIcon } from "lucide-react";

interface CategoryIconProps {
  iconName: string;
  colorClass: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

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
  // Dynamically get the icon from lucide-react's icons object
  const Icon: LucideIcon = (icons[iconName as keyof typeof icons] as LucideIcon) || icons.Circle;
  
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
