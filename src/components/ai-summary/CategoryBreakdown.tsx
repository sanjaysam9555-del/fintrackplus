import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  percent: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  total: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(220, 70%, 50%)',
];

const formatAmount = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString()}`;
};

export const CategoryBreakdown = ({ data, total }: CategoryBreakdownProps) => {
  if (data.length === 0 || total === 0) return null;
  
  // Take top 5 and group rest as "Other"
  const top5 = data.slice(0, 5);
  const otherSum = data.slice(5).reduce((sum, cat) => sum + cat.value, 0);
  
  const chartData = [
    ...top5,
    ...(otherSum > 0 ? [{ name: 'Other', value: otherSum, color: '#888', percent: (otherSum / total) * 100 }] : [])
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs font-medium">{data.name}</p>
          <p className="text-xs text-muted-foreground">{formatAmount(data.value)}</p>
          <p className="text-xs text-primary font-medium">{data.percent.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieIcon size={18} className="text-primary" />
        <h3 className="font-semibold">Where Your Money Goes</h3>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Pie Chart */}
        <div className="w-32 h-32 md:w-44 md:h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {chartData.slice(0, 5).map((cat, index) => (
            <div key={cat.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs truncate max-w-[100px] md:max-w-[160px]">{cat.name}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {cat.percent.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
