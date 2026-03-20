import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Download, FileText, CalendarDays, Package, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface ReportsSectionProps {
  onBack: () => void;
}

type TimeFrame = 'week' | 'month' | 'year' | 'custom';

export const ReportsSection = ({ onBack }: ReportsSectionProps) => {
  const { transactions, categories, addNotification, projects, partners, userProfile } = useFinanceStore();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isExportingCA, setIsExportingCA] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dateRange = useMemo(() => {
    const today = new Date();
    switch (timeFrame) {
      case 'week':
        return { start: subDays(today, 7), end: today };
      case 'month':
        return { start: startOfMonth(today), end: today };
      case 'year':
        return { start: startOfYear(today), end: today };
      case 'custom':
        return { start: startDate, end: endDate };
      default:
        return { start: startOfMonth(today), end: today };
    }
  }, [timeFrame, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    const start = format(dateRange.start, 'yyyy-MM-dd');
    const end = format(dateRange.end, 'yyyy-MM-dd');
    return transactions.filter(t => t.date >= start && t.date <= end);
  }, [transactions, dateRange]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;
  
  const clientName = userProfile.name || 'User';
  const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'User';

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export in this period");
      return;
    }

    // Professional header rows
    const reportHeader = [
      ['FinTrack+ - Financial Report'],
      [''],
      ['Client Name:', clientName],
      ['Report Period:', `${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}`],
      ['Generated On:', format(new Date(), 'MMM dd, yyyy HH:mm')],
      ['Total Transactions:', stats.count.toString()],
      [''],
      ['Summary'],
      ['Total Income:', formatCurrency(stats.income)],
      ['Total Expense:', formatCurrency(stats.expense)],
      ['Net Balance:', formatCurrency(stats.balance)],
      [''],
    ];

    // Data headers with all relevant fields
    const headers = ['Date', 'Time', 'Title', 'Type', 'Vendor', 'Category', 'Project', 'Partner', 'Amount', 'Payment Method', 'GST', 'Notes'];
    
    const rows = filteredTransactions.map(t => {
      const category = categories.find(c => c.id === t.categoryId);
      const project = projects.find(p => p.id === t.projectId);
      const partner = partners.find(p => p.userId === t.handledBy);
      return [
        t.date,
        t.time,
        (t.title || '').replace(/"/g, '""'),
        t.type === 'income' ? 'Income' : 'Expense',
        (t.vendor || '').replace(/"/g, '""'),
        category?.name || 'Other',
        project?.name || '',
        partner?.name || '',
        t.amount.toString(),
        t.paymentMethod === 'cash' ? 'Cash' : 'Online',
        t.isGst ? 'Yes' : 'No',
        (t.notes || '').replace(/"/g, '""')
      ].map(field => `"${field}"`);
    });

    // Combine header info with data
    const csvContent = [
      ...reportHeader.map(row => row.join(',')),
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedClientName} - ${format(dateRange.start, 'MMM yyyy')} to ${format(dateRange.end, 'MMM yyyy')} - Report - FinTrack Plus.csv`;
    a.click();
    URL.revokeObjectURL(url);

    addNotification({
      type: 'export',
      title: 'CSV Exported',
      message: `${userProfile.name || 'Unknown'} exported ${filteredTransactions.length} transactions as CSV`,
      details: [
        { field: 'Period', from: '', to: `${format(dateRange.start, 'MMM dd, yyyy')} – ${format(dateRange.end, 'MMM dd, yyyy')}` },
        { field: 'Transactions', from: '', to: `${filteredTransactions.length}` },
        { field: 'Format', from: '', to: 'CSV' },
      ],
    });
    toast.success('CSV exported successfully!');
  };

  const handleExportCAPackage = async () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export in this period");
      return;
    }

    setIsExportingCA(true);
    
    try {
      const zip = new JSZip();
      const receiptFolder = zip.folder("receipts");
      
      // 1. Create main transactions CSV
      const csvHeaders = ['Date', 'Time', 'Type', 'Title', 'Vendor', 'Category', 'Project', 'Amount', 'Payment Method', 'GST', 'Receipt File', 'Notes'];
      const csvRows = filteredTransactions.map((t, index) => {
        const category = categories.find(c => c.id === t.categoryId);
        const project = projects.find(p => p.id === t.projectId);
        const receiptFileName = t.receiptUrl ? `receipt_${String(index + 1).padStart(3, '0')}.jpg` : '';
        return [
          t.date,
          t.time,
          t.type,
          t.title || '',
          t.vendor,
          category?.name || 'Other',
          project?.name || '',
          t.amount.toString(),
          t.paymentMethod,
          t.isGst ? 'Yes' : 'No',
          receiptFileName,
          (t.notes || '').replace(/"/g, '""')
        ].map(field => `"${field}"`).join(',');
      });
      
      const transactionsCsv = [csvHeaders.join(','), ...csvRows].join('\n');
      zip.file('transactions.csv', transactionsCsv);
      
      // 2. Create GST summary CSV
      const gstTransactions = filteredTransactions.filter(t => t.isGst);
      const gstExpenses = gstTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const gstIncome = gstTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      
      const gstSummaryCsv = [
        'Period Start,Period End,GST Expenses,GST Income,Net GST Amount,Total GST Transactions',
        `"${format(dateRange.start, 'yyyy-MM-dd')}","${format(dateRange.end, 'yyyy-MM-dd')}",${gstExpenses},${gstIncome},${gstIncome - gstExpenses},${gstTransactions.length}`
      ].join('\n');
      zip.file('gst_summary.csv', gstSummaryCsv);
      
      // 3. Download and add receipts
      const receiptsToDownload = filteredTransactions
        .filter(t => t.receiptUrl)
        .map((t, index) => ({ url: t.receiptUrl!, fileName: `receipt_${String(index + 1).padStart(3, '0')}.jpg` }));
      
      for (const receipt of receiptsToDownload) {
        try {
          const response = await fetch(receipt.url);
          if (response.ok) {
            const blob = await response.blob();
            receiptFolder?.file(receipt.fileName, blob);
          }
        } catch (err) {
          console.warn(`Failed to download receipt: ${receipt.url}`, err);
        }
      }
      
      // 4. Create README
      const readme = `CA Export Package
================

Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}
Period: ${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}

Contents:
- transactions.csv: All ${filteredTransactions.length} transactions
- gst_summary.csv: GST transaction summary
- receipts/: ${receiptsToDownload.length} receipt images

Summary:
- Total Income: ₹${stats.income.toLocaleString()}
- Total Expenses: ₹${stats.expense.toLocaleString()}
- Net Balance: ₹${stats.balance.toLocaleString()}
- GST Transactions: ${gstTransactions.length}

Generated by FinTrack+
`;
      zip.file('README.txt', readme);
      
      // 5. Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedClientName} - CA Export - ${format(dateRange.start, 'MMM yyyy')} to ${format(dateRange.end, 'MMM yyyy')} - FinTrack Plus.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      addNotification({
        type: 'export',
        title: 'CA Package Exported',
        message: `${userProfile.name || 'Unknown'} exported CA package — ${filteredTransactions.length} transactions + ${receiptsToDownload.length} receipts`,
        details: [
          { field: 'Period', from: '', to: `${format(dateRange.start, 'MMM dd, yyyy')} – ${format(dateRange.end, 'MMM dd, yyyy')}` },
          { field: 'Transactions', from: '', to: `${filteredTransactions.length}` },
          { field: 'Receipts', from: '', to: `${receiptsToDownload.length}` },
          { field: 'Format', from: '', to: 'ZIP (CA Package)' },
        ],
      });
      toast.success('CA package exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CA package');
    } finally {
      setIsExportingCA(false);
    }
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export in this period");
      return;
    }

    // Build transaction rows HTML
    const transactionRows = filteredTransactions.map(t => {
      const category = categories.find(c => c.id === t.categoryId);
      const project = projects.find(p => p.id === t.projectId);
      const partner = partners.find(p => p.userId === t.handledBy);
      const timeShort = t.time ? t.time.slice(0, 5) : '';
      return `
        <tr>
          <td>${t.date} ${timeShort}</td>
          <td>${t.title || '-'}</td>
          <td style="color: ${t.type === 'income' ? '#22c55e' : '#ef4444'}; font-weight: 600;">
            ${t.type === 'income' ? 'Income' : 'Expense'}
          </td>
          <td>${t.vendor}</td>
          <td>${category?.name || 'Other'}</td>
          <td>${project?.name || '-'}</td>
          <td>${partner?.name || '-'}</td>
          <td style="text-align: right; font-weight: 700;">${formatCurrency(t.amount)}</td>
          <td>${t.paymentMethod === 'cash' ? 'Cash' : 'Online'}</td>
          <td>${t.isGst ? 'Yes' : 'No'}</td>
          <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=1200">
        <title>${clientName} - Report - FinTrack Plus</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { background: #ffffff; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            color: #1f2937;
            padding: 30px 40px; 
            color: #1f2937;
            font-size: 14px;
            min-width: 1100px;
          }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 2px solid #6366f1; }
          .header h1 { color: #6366f1; margin: 0 0 6px 0; font-size: 24px; }
          .header .subtitle { color: #6b7280; font-size: 14px; }
          .meta { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 12px; 
            background: #f9fafb; 
            padding: 18px; 
            border-radius: 8px; 
            margin-bottom: 24px; 
          }
          .meta-item { }
          .meta-label { color: #6b7280; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
          .meta-value { font-weight: 600; font-size: 14px; word-break: break-word; }
          .summary { 
            display: flex; 
            gap: 16px; 
            margin-bottom: 24px; 
          }
          .stat-box { 
            flex: 1;
            padding: 16px; 
            border-radius: 10px; 
            text-align: center; 
          }
          .stat-box.income { background: #dcfce7; }
          .stat-box.expense { background: #fee2e2; }
          .stat-box.balance { background: #e0e7ff; }
          .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }
          .stat-value { font-size: 20px; font-weight: 700; }
          .stat-box.income .stat-value { color: #16a34a; }
          .stat-box.expense .stat-value { color: #dc2626; }
          .stat-box.balance .stat-value { color: #4f46e5; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 11px; 
            margin-top: 12px;
            table-layout: fixed;
          }
          th { 
            background: #6366f1; 
            color: white; 
            padding: 8px 6px; 
            text-align: left; 
            font-weight: 600;
            font-size: 9px;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
          }
          td { 
            padding: 7px 6px; 
            border-bottom: 1px solid #e5e7eb;
            word-break: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          tr:nth-child(even) { background: #f9fafb; }
          .table-wrapper {
            overflow-x: auto;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #9ca3af; 
            font-size: 11px; 
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          @media print {
            body { padding: 20px 30px; min-width: auto; }
            .header { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FinTrack⁺</h1>
          <p class="subtitle">Financial Report</p>
        </div>
        
        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">Client Name</div>
            <div class="meta-value">${clientName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Report Period</div>
            <div class="meta-value">${format(dateRange.start, 'MMM dd, yyyy')} to ${format(dateRange.end, 'MMM dd, yyyy')}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Generated On</div>
            <div class="meta-value">${format(new Date(), 'MMM dd, yyyy HH:mm')}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Total Transactions</div>
            <div class="meta-value">${stats.count}</div>
          </div>
        </div>
        
        <div class="summary">
          <div class="stat-box income">
            <div class="stat-label">Total Income</div>
            <div class="stat-value">${formatCurrency(stats.income)}</div>
          </div>
          <div class="stat-box expense">
            <div class="stat-label">Total Expense</div>
            <div class="stat-value">${formatCurrency(stats.expense)}</div>
          </div>
          <div class="stat-box balance">
            <div class="stat-label">Net Balance</div>
            <div class="stat-value">${formatCurrency(stats.balance)}</div>
          </div>
        </div>
        
        <div class="table-wrapper">
        <table>
          <colgroup>
            <col style="width: 12%;" />
            <col style="width: 12%;" />
            <col style="width: 6%;" />
            <col style="width: 10%;" />
            <col style="width: 9%;" />
            <col style="width: 9%;" />
            <col style="width: 8%;" />
            <col style="width: 11%;" />
            <col style="width: 7%;" />
            <col style="width: 4%;" />
            <col style="width: 12%;" />
          </colgroup>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Title</th>
              <th>Type</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Project</th>
              <th>Partner</th>
              <th style="text-align: right;">Amount</th>
              <th>Payment</th>
              <th>GST</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows}
          </tbody>
        </table>
        </div>
        
        <div class="footer">
          Generated by FinTrack⁺ • ${format(new Date(), 'yyyy')}
        </div>
      </body>
      </html>
    `;
    
    setPdfPreviewHtml(htmlContent);
    addNotification({
      type: 'export',
      title: 'PDF Report Generated',
      message: `${userProfile.name || 'Unknown'} generated PDF report — ${filteredTransactions.length} transactions`,
      details: [
        { field: 'Period', from: '', to: `${format(dateRange.start, 'MMM dd, yyyy')} – ${format(dateRange.end, 'MMM dd, yyyy')}` },
        { field: 'Transactions', from: '', to: `${filteredTransactions.length}` },
        { field: 'Format', from: '', to: 'PDF' },
      ],
    });
  };

  const handleDownloadPdf = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 flex items-center gap-3 p-4 safe-top border-b border-border">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Reports</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Time Frame Selector */}
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-3">Time Frame</p>
          <div className="flex gap-2 mb-3">
            {(['week', 'month', 'year'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  timeFrame === tf
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={() => setTimeFrame('custom')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border",
                    timeFrame === 'custom' ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  <CalendarDays size={14} />
                  {format(timeFrame === 'custom' ? startDate : dateRange.start, 'MMM dd')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      setTimeFrame('custom');
                    }
                  }}
                  className="p-2"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={() => setTimeFrame('custom')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm border",
                    timeFrame === 'custom' ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  <CalendarDays size={14} />
                  {format(timeFrame === 'custom' ? endDate : dateRange.end, 'MMM dd')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="end">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      setTimeFrame('custom');
                    }
                  }}
                  disabled={(date) => date < startDate}
                  className="p-2"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-3">Summary</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-lg font-bold text-success">₹{stats.income.toLocaleString()}</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Expense</p>
              <p className="text-lg font-bold text-destructive">₹{stats.expense.toLocaleString()}</p>
            </div>
            <div className="bg-accent rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={cn("text-lg font-bold", stats.balance >= 0 ? "text-success" : "text-destructive")}>
                ₹{stats.balance.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-lg font-bold">{stats.count}</p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Export Options</p>
          
          {/* CA Export Package - Primary */}
          <button
            onClick={handleExportCAPackage}
            disabled={isExportingCA}
            className="w-full flex items-center gap-3 p-4 bg-primary/5 rounded-xl border-2 border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              {isExportingCA ? (
                <Loader2 size={18} className="text-accent-foreground animate-spin" />
              ) : (
                <Package size={18} className="text-accent-foreground" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Download CA Package</p>
              <p className="text-sm text-muted-foreground">
                {isExportingCA ? 'Preparing export...' : `ZIP with CSV + ${filteredTransactions.filter(t => t.receiptUrl).length} receipts`}
              </p>
            </div>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Download size={18} className="text-accent-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Export as CSV</p>
              <p className="text-sm text-muted-foreground">{stats.count} transactions</p>
            </div>
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileText size={18} className="text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Export as PDF</p>
              <p className="text-sm text-muted-foreground">{stats.count} transactions</p>
            </div>
          </button>
        </div>
      </div>

      {/* PDF Preview Overlay - rendered via portal to escape scroll context */}
      {createPortal(
        <AnimatePresence>
          {pdfPreviewHtml && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background flex flex-col"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              {/* Top Bar */}
              <div className="shrink-0 flex items-center px-2 py-3 border-b border-border bg-card gap-2" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                <button
                  onClick={() => setPdfPreviewHtml(null)}
                  className="p-2 rounded-full hover:bg-muted shrink-0"
                >
                  <ArrowLeft size={20} />
                </button>
                <p className="flex-1 text-sm font-semibold text-center truncate">Report Preview</p>
                <Button size="sm" onClick={handleDownloadPdf} className="gap-1.5 shrink-0">
                  <Download size={14} />
                  Save PDF
                </Button>
              </div>
              {/* iframe */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  srcDoc={pdfPreviewHtml}
                  className="w-full h-full border-0"
                  title="PDF Report Preview"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
