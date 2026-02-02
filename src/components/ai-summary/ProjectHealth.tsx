import { motion } from "framer-motion";
import { FolderOpen, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/lib/types";

interface ProjectWithSpending extends Project {
  spent: number;
  income: number;
}

interface ProjectHealthProps {
  projects: ProjectWithSpending[];
}

const formatAmount = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString()}`;
};

const getProgressColor = (percent: number) => {
  if (percent >= 100) return 'bg-destructive';
  if (percent >= 80) return 'bg-amber-500';
  return 'bg-success';
};

const getStatusIcon = (percent: number) => {
  if (percent >= 100) return <XCircle size={14} className="text-destructive" />;
  if (percent >= 80) return <AlertTriangle size={14} className="text-amber-500" />;
  return <CheckCircle size={14} className="text-success" />;
};

const getStatusText = (percent: number) => {
  if (percent >= 100) return 'Over Budget';
  if (percent >= 80) return 'Approaching Limit';
  return 'On Track';
};

export const ProjectHealth = ({ projects }: ProjectHealthProps) => {
  // Filter projects with budgets
  const projectsWithBudget = projects.filter(p => p.budgetLimit > 0 && !p.archived);
  
  if (projectsWithBudget.length === 0) return null;
  
  // Sort by budget consumption percentage (highest first)
  const sortedProjects = projectsWithBudget
    .map(p => ({
      ...p,
      percent: (p.spent / p.budgetLimit) * 100,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4); // Show top 4

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen size={18} className="text-primary" />
        <h3 className="font-semibold">Project Health</h3>
      </div>
      
      <div className="space-y-4">
        {sortedProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + index * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-sm font-medium truncate">{project.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {getStatusIcon(project.percent)}
                <span className="text-xs text-muted-foreground">
                  {getStatusText(project.percent)}
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(project.percent, 100)}%` }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
                className={cn("h-full rounded-full", getProgressColor(project.percent))}
              />
            </div>
            
            {/* Budget details */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Spent: {formatAmount(project.spent)}</span>
              <span>Budget: {formatAmount(project.budgetLimit)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
