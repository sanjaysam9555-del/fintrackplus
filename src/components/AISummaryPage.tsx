import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { useFYRange, useMonthRanges, getLast6Months } from "@/hooks/useFYRange";
import { FYHeroCard } from "./ai-summary/FYHeroCard";
import { SpendingTrendChart } from "./ai-summary/SpendingTrendChart";
import { SmartInsights, generateInsights } from "./ai-summary/SmartInsights";
import { CategoryBreakdown } from "./ai-summary/CategoryBreakdown";
import { ProjectHealth } from "./ai-summary/ProjectHealth";
import { PaymentMethods } from "./ai-summary/PaymentMethods";
import { PendingInstallments } from "./ai-summary/PendingInstallments";
import { DeepInsights, type DeepInsight } from "./ai-summary/DeepInsights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISummaryPageProps {
  onBack?: () => void;
}

export const AISummaryPage = ({ onBack }: AISummaryPageProps) => {
  const { 
    transactions, 
    categories, 
    projects, 
    partners,
    getTotalIncome, 
    getTotalExpense,
    getCategoryById,
    getProjectSpending,
    getProjectIncome,
    getPartnerBalances,
  } = useFinanceStore();
  
  const fyRange = useFYRange();
  const monthRanges = useMonthRanges();
  
  // Deep Insights state
  const [deepInsights, setDeepInsights] = useState<DeepInsight[]>([]);
  const [isGeneratingDeep, setIsGeneratingDeep] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  
  // FY totals
  const fyIncome = useMemo(() => getTotalIncome(fyRange.start, fyRange.end), [fyRange, getTotalIncome]);
  const fyExpense = useMemo(() => getTotalExpense(fyRange.start, fyRange.end), [fyRange, getTotalExpense]);
  
  // Month totals for insights
  const currentMonthExpense = useMemo(() => 
    getTotalExpense(monthRanges.currentMonth.start, monthRanges.currentMonth.end),
    [monthRanges, getTotalExpense]
  );
  const lastMonthExpense = useMemo(() => 
    getTotalExpense(monthRanges.lastMonth.start, monthRanges.lastMonth.end),
    [monthRanges, getTotalExpense]
  );
  
  // Last 3 month average
  const last3MonthAvgExpense = useMemo(() => {
    const total = getTotalExpense(monthRanges.last3Months.start, monthRanges.last3Months.end);
    return total / 3;
  }, [monthRanges, getTotalExpense]);
  
  // 6-month trend data
  const trendData = useMemo(() => {
    const months = getLast6Months();
    return months.map(month => ({
      label: month.label,
      income: getTotalIncome(month.start, month.end),
      expense: getTotalExpense(month.start, month.end),
    }));
  }, [getTotalIncome, getTotalExpense]);
  
  // Category breakdown (FY)
  const categoryData = useMemo(() => {
    const spending: Record<string, { name: string; value: number; color: string }> = {};
    
    transactions
      .filter(t => t.type === 'expense' && t.date >= fyRange.start && t.date <= fyRange.end)
      .forEach(t => {
        const category = getCategoryById(t.categoryId);
        const name = category?.name || 'Other';
        const color = category?.color || '#888';
        
        if (!spending[name]) {
          spending[name] = { name, value: 0, color };
        }
        spending[name].value += t.amount;
      });
    
    const sorted = Object.values(spending)
      .sort((a, b) => b.value - a.value)
      .map(cat => ({
        ...cat,
        percent: fyExpense > 0 ? (cat.value / fyExpense) * 100 : 0,
      }));
    
    return sorted;
  }, [transactions, fyRange, getCategoryById, fyExpense]);
  
  // Top category change (current month vs 3-month avg)
  const topCategoryInsight = useMemo(() => {
    if (categoryData.length === 0) return { name: '', change: 0 };
    
    const topCat = categoryData[0];
    const catId = categories.find(c => c.name === topCat.name)?.id;
    
    if (!catId) return { name: topCat.name, change: 0 };
    
    const currentMonthCatExpense = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.categoryId === catId && 
        t.date >= monthRanges.currentMonth.start && 
        t.date <= monthRanges.currentMonth.end
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const last3MonthCatExpense = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.categoryId === catId && 
        t.date >= monthRanges.last3Months.start && 
        t.date <= monthRanges.last3Months.end
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const avg = last3MonthCatExpense / 3;
    const change = avg > 0 ? ((currentMonthCatExpense - avg) / avg) * 100 : 0;
    
    return { name: topCat.name, change };
  }, [categoryData, categories, transactions, monthRanges]);
  
  // Vendor concentration
  const vendorInsight = useMemo(() => {
    const vendorTotals: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense' && t.date >= fyRange.start && t.date <= fyRange.end)
      .forEach(t => {
        vendorTotals[t.vendor] = (vendorTotals[t.vendor] || 0) + t.amount;
      });
    
    const sorted = Object.entries(vendorTotals).sort(([, a], [, b]) => b - a);
    
    if (sorted.length === 0 || fyExpense === 0) return { name: '', percent: 0 };
    
    return {
      name: sorted[0][0],
      percent: (sorted[0][1] / fyExpense) * 100,
    };
  }, [transactions, fyRange, fyExpense]);
  
  // Daily average (current month)
  const dailyAverage = useMemo(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth > 0 ? currentMonthExpense / dayOfMonth : 0;
  }, [currentMonthExpense]);
  
  // Profit margin
  const profitMargin = fyIncome > 0 ? ((fyIncome - fyExpense) / fyIncome) * 100 : 0;
  
  // Generate smart insights
  const insights = useMemo(() => generateInsights({
    currentMonthExpense,
    lastMonthExpense,
    last3MonthAvgExpense,
    profitMargin,
    topVendorPercent: vendorInsight.percent,
    topVendorName: vendorInsight.name,
    topCategoryName: topCategoryInsight.name,
    topCategoryChange: topCategoryInsight.change,
    dailyAverage,
    fyIncome,
  }), [
    currentMonthExpense, 
    lastMonthExpense, 
    last3MonthAvgExpense, 
    profitMargin,
    vendorInsight,
    topCategoryInsight,
    dailyAverage,
    fyIncome
  ]);
  
  // Projects with spending
  const projectsWithSpending = useMemo(() => 
    projects.map(p => ({
      ...p,
      spent: getProjectSpending(p.id),
      income: getProjectIncome(p.id),
    })),
    [projects, getProjectSpending, getProjectIncome]
  );
  
  // Payment method split (FY expenses)
  const paymentSplit = useMemo(() => {
    const fyTxns = transactions.filter(t => t.date >= fyRange.start && t.date <= fyRange.end);
    const expenseCash = fyTxns.filter(t => t.type === 'expense' && t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0);
    const expenseOnline = fyTxns.filter(t => t.type === 'expense' && t.paymentMethod === 'online').reduce((s, t) => s + t.amount, 0);
    const incomeCash = fyTxns.filter(t => t.type === 'income' && t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0);
    const incomeOnline = fyTxns.filter(t => t.type === 'income' && t.paymentMethod === 'online').reduce((s, t) => s + t.amount, 0);
    return { expenseCash, expenseOnline, incomeCash, incomeOnline };
  }, [transactions, fyRange]);
  
  const hasData = transactions.length > 0;

  // Build AI payload
  const buildAIPayload = useCallback(() => {
    const fyTxns = transactions.filter(t => t.date >= fyRange.start && t.date <= fyRange.end);
    const netBalance = fyIncome - fyExpense;

    // Partner breakdowns
    const partnerBalances = getPartnerBalances();
    const partnerBreakdowns = partnerBalances.map(pb => ({
      name: pb.partner.name,
      cashIncome: pb.cashIncome,
      cashExpense: pb.cashExpense,
      onlineIncome: pb.onlineIncome,
      onlineExpense: pb.onlineExpense,
      cashBalance: pb.cashBalance,
      onlineBalance: pb.onlineBalance,
    }));

    const cashBalance = partnerBalances.reduce((s, pb) => s + pb.cashBalance, 0);
    const onlineBalance = partnerBalances.reduce((s, pb) => s + pb.onlineBalance, 0);

    // Project margins
    const projectMargins = projects.map(p => {
      const income = getProjectIncome(p.id);
      const expense = getProjectSpending(p.id);
      const margin = income > 0 ? ((income - expense) / income) * 100 : 0;
      return {
        name: p.name,
        clientCost: p.clientCost,
        income,
        expense,
        marginPercent: Math.round(margin),
      };
    }).filter(p => p.income > 0 || p.expense > 0);

    // Top vendors
    const vendorTotals: Record<string, number> = {};
    fyTxns.filter(t => t.type === 'expense').forEach(t => {
      vendorTotals[t.vendor] = (vendorTotals[t.vendor] || 0) + t.amount;
    });
    const topVendors = Object.entries(vendorTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, totalSpend]) => ({
        name,
        totalSpend,
        percentOfTotal: fyExpense > 0 ? Math.round((totalSpend / fyExpense) * 100) : 0,
      }));

    // Monthly trend (last 6 months)
    const monthlyTrend = trendData.map(d => ({
      month: d.label,
      income: d.income,
      expense: d.expense,
    }));

    // GST %
    const gstCount = fyTxns.filter(t => t.isGst).length;
    const gstTransactionPercent = fyTxns.length > 0 ? Math.round((gstCount / fyTxns.length) * 100) : 0;

    // Category breakdown for AI
    const aiCategoryBreakdown = categoryData.map(c => ({
      name: c.name,
      amount: c.value,
      percent: Math.round(c.percent),
    }));

    return {
      fyIncome,
      fyExpense,
      netBalance,
      cashBalance,
      onlineBalance,
      partnerBreakdowns,
      projectMargins,
      topVendors,
      monthlyTrend,
      gstTransactionPercent,
      categoryBreakdown: aiCategoryBreakdown,
      paymentMethodSplit: paymentSplit,
    };
  }, [transactions, fyRange, fyIncome, fyExpense, projects, getProjectIncome, getProjectSpending, getPartnerBalances, trendData, categoryData, paymentSplit]);

  const generateDeepInsights = useCallback(async () => {
    setIsGeneratingDeep(true);
    setDeepError(null);
    try {
      const payload = buildAIPayload();
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: payload,
      });
      if (error) throw error;
      if (Array.isArray(data)) {
        setDeepInsights(data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: any) {
      console.error('Deep insights error:', err);
      const message = err?.message || 'Failed to generate insights';
      setDeepError(message);
      toast.error(message);
    } finally {
      setIsGeneratingDeep(false);
    }
  }, [buildAIPayload]);

  return (
    <div className="min-h-screen pb-40 md:pb-8 md:px-6 md:max-w-6xl">
      {/* Header */}
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Summary</h1>
            <p className="text-sm text-muted-foreground">Smart insights from your spending</p>
          </div>
        </div>
      </div>
      
      {!hasData ? (
        <div className="px-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No insights yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add more transactions to get AI-powered insights
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FY Hero Card - full width */}
          <div className="md:col-span-2">
            <FYHeroCard
              fyLabel={fyRange.label}
              totalIncome={fyIncome}
              totalExpense={fyExpense}
            />
          </div>
          
          {/* 6-Month Trend + Category Breakdown side by side */}
          <SpendingTrendChart data={trendData} />
          <CategoryBreakdown 
            data={categoryData} 
            total={fyExpense} 
          />
          
          {/* Smart Insights - full width */}
          <div className="md:col-span-2">
            <SmartInsights insights={insights} />
          </div>
          
          {/* Deep Insights - full width */}
          <div className="md:col-span-2">
            <DeepInsights
              insights={deepInsights}
              isLoading={isGeneratingDeep}
              error={deepError}
              onGenerate={generateDeepInsights}
              onRegenerate={generateDeepInsights}
              hasData={hasData}
            />
          </div>
          
          {/* Project Health + Payment Methods side by side */}
          <ProjectHealth projects={projectsWithSpending} />
          <PaymentMethods 
            expenseCash={paymentSplit.expenseCash}
            expenseOnline={paymentSplit.expenseOnline}
            incomeCash={paymentSplit.incomeCash}
            incomeOnline={paymentSplit.incomeOnline}
          />
          
          {/* Pending Installments - full width */}
          <div className="md:col-span-2">
            <PendingInstallments transactions={transactions} />
          </div>
        </div>
      )}
    </div>
  );
};
