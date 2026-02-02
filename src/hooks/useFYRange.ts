import { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const useFYRange = () => {
  return useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
    const currentYear = today.getFullYear();
    
    // FY starts April 1st
    // If current month is Jan/Feb/Mar (0-2), FY started last year
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    
    return {
      start: `${fyStartYear}-04-01`,
      end: `${fyStartYear + 1}-03-31`,
      label: `FY ${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`,
    };
  }, []);
};

export const useMonthRanges = () => {
  return useMemo(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = endOfMonth(subMonths(today, 1));
    
    // Last 3 months for average calculation
    const threeMonthsAgo = startOfMonth(subMonths(today, 3));
    
    return {
      currentMonth: {
        start: format(currentMonthStart, 'yyyy-MM-dd'),
        end: format(currentMonthEnd, 'yyyy-MM-dd'),
        label: format(currentMonthStart, 'MMMM yyyy'),
      },
      lastMonth: {
        start: format(lastMonthStart, 'yyyy-MM-dd'),
        end: format(lastMonthEnd, 'yyyy-MM-dd'),
        label: format(lastMonthStart, 'MMMM yyyy'),
      },
      last3Months: {
        start: format(threeMonthsAgo, 'yyyy-MM-dd'),
        end: format(lastMonthEnd, 'yyyy-MM-dd'),
      },
    };
  }, []);
};

// Get last 6 months for trend chart
export const getLast6Months = () => {
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(today, i);
    months.push({
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd'),
      label: format(date, 'MMM'),
      fullLabel: format(date, 'MMMM yyyy'),
    });
  }
  
  return months;
};
