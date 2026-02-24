import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export type TimeFilter = 'week' | 'month' | 'year' | 'fy' | 'all' | 'custom';

export const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'fy', label: 'FY' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

export const getTimeFilterLabel = (timeFilter: TimeFilter, customStartDate?: Date, customEndDate?: Date) => {
  const today = new Date();
  switch (timeFilter) {
    case 'fy': {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
      return `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
    }
    case 'week': return 'This Week';
    case 'month': return format(today, 'MMMM yyyy');
    case 'year': return format(today, 'yyyy');
    case 'all': return 'All Time';
    case 'custom':
      if (customStartDate && customEndDate) {
        return `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd')}`;
      }
      return 'Custom';
    default: return format(today, 'MMMM yyyy');
  }
};

export const computeDateRange = (
  timeFilter: TimeFilter,
  customStartDate?: Date,
  customEndDate?: Date
): { start: string; end: string } => {
  const today = new Date();
  const start = new Date();

  switch (timeFilter) {
    case 'fy': {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
      return {
        start: `${fyStartYear}-04-01`,
        end: `${fyStartYear + 1}-03-31`,
      };
    }
    case 'week':
      start.setDate(today.getDate() - 7);
      break;
    case 'month':
      start.setDate(1);
      break;
    case 'year':
      start.setMonth(0, 1);
      break;
    case 'all':
      return { start: '2000-01-01', end: '2099-12-31' };
    case 'custom':
      if (customStartDate && customEndDate) {
        return {
          start: format(customStartDate, 'yyyy-MM-dd'),
          end: format(customEndDate, 'yyyy-MM-dd'),
        };
      }
      start.setDate(1);
      break;
    default:
      start.setDate(1);
  }

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd'),
  };
};

interface TimeFrameSelectorProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomStartDateChange: (date: Date | undefined) => void;
  onCustomEndDateChange: (date: Date | undefined) => void;
  className?: string;
}

export const TimeFrameSelector = ({
  timeFilter,
  onTimeFilterChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  className,
}: TimeFrameSelectorProps) => {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const handleStartSelect = useCallback((date: Date | undefined) => {
    onCustomStartDateChange(date);
    if (date) {
      onTimeFilterChange('custom');
      setStartOpen(false);
      // Auto-open end date picker
      setTimeout(() => setEndOpen(true), 150);
    }
  }, [onCustomStartDateChange, onTimeFilterChange]);

  const handleEndSelect = useCallback((date: Date | undefined) => {
    onCustomEndDateChange(date);
    if (date) {
      onTimeFilterChange('custom');
      setEndOpen(false);
    }
  }, [onCustomEndDateChange, onTimeFilterChange]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex p-1 bg-muted rounded-xl">
        {TIME_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeFilterChange(option.value)}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium transition-colors text-sm",
              timeFilter === option.value
                ? "bg-card shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {timeFilter === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-2"
        >
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "MMM dd, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card z-[60] pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={handleStartSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "MMM dd, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card z-[60] pointer-events-auto" align="end">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={handleEndSelect}
                disabled={(date) => customStartDate ? date < customStartDate : false}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </motion.div>
      )}
    </div>
  );
};

/** Compact version used in popovers (Dashboard header) */
interface CompactTimeFrameSelectorProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomStartDateChange: (date: Date | undefined) => void;
  onCustomEndDateChange: (date: Date | undefined) => void;
  onClose: () => void;
}

export const CompactTimeFrameSelector = ({
  timeFilter,
  onTimeFilterChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onClose,
}: CompactTimeFrameSelectorProps) => {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const handleStartSelect = useCallback((date: Date | undefined) => {
    onCustomStartDateChange(date);
    if (date) {
      onTimeFilterChange('custom');
      setStartOpen(false);
      setTimeout(() => setEndOpen(true), 150);
    }
  }, [onCustomStartDateChange, onTimeFilterChange]);

  const handleEndSelect = useCallback((date: Date | undefined) => {
    onCustomEndDateChange(date);
    if (date && customStartDate) {
      onTimeFilterChange('custom');
      setEndOpen(false);
      onClose();
    }
  }, [onCustomEndDateChange, onTimeFilterChange, customStartDate, onClose]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">Time Frame</p>

      {/* Quick Filters - 2 rows of 3 */}
      <div className="grid grid-cols-3 gap-1">
        {TIME_FILTER_OPTIONS.filter(o => o.value !== 'custom').map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onTimeFilterChange(option.value);
              onClose();
            }}
            className={cn(
              "px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
              timeFilter === option.value && timeFilter !== 'custom'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="border-t border-border pt-2 mt-2">
        <p className="text-[10px] text-muted-foreground mb-1.5">Custom Range</p>
        <div className="flex gap-1.5">
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 px-2 py-1.5 text-xs rounded-md border text-center",
                  customStartDate ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                )}
              >
                {customStartDate ? format(customStartDate, "MMM dd") : "From"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card z-[70] pointer-events-auto" align="start" side="bottom">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={handleStartSelect}
                className="p-2 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground self-center">–</span>
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex-1 px-2 py-1.5 text-xs rounded-md border text-center",
                  customEndDate ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                )}
              >
                {customEndDate ? format(customEndDate, "MMM dd") : "To"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card z-[70] pointer-events-auto" align="end" side="bottom">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={handleEndSelect}
                disabled={(date) => customStartDate ? date < customStartDate : false}
                className="p-2 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
