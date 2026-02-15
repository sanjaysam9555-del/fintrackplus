import { Transaction, Category, Project } from './types';
import { formatCurrency, formatDate, formatTime } from './constants';

interface ShareData {
  transaction: Transaction;
  categoryName?: string;
  projectName?: string;
  projectColor?: string;
}

const CARD_WIDTH = 400;
const PADDING = 24;
const LINE_HEIGHT = 28;

function getThemeColors(): { bg: string; card: string; text: string; muted: string; border: string; expense: string; income: string } {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    return {
      bg: '#0a0a0a',
      card: '#141414',
      text: '#f5f5f5',
      muted: '#a1a1aa',
      border: '#27272a',
      expense: '#ef4444',
      income: '#22c55e',
    };
  }
  return {
    bg: '#ffffff',
    card: '#f8f9fa',
    text: '#18181b',
    muted: '#71717a',
    border: '#e4e4e7',
    expense: '#dc2626',
    income: '#16a34a',
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawDetailRow(ctx: CanvasRenderingContext2D, label: string, value: string, y: number, colors: ReturnType<typeof getThemeColors>) {
  ctx.font = '500 13px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.muted;
  ctx.fillText(label, PADDING + 16, y);

  ctx.fillStyle = colors.text;
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  // Truncate long values
  const maxWidth = CARD_WIDTH - PADDING * 2 - 120;
  let displayValue = value;
  while (ctx.measureText(displayValue).width > maxWidth && displayValue.length > 3) {
    displayValue = displayValue.slice(0, -4) + '...';
  }
  ctx.fillText(displayValue, PADDING + 110, y);
}

export async function shareTransaction({ transaction, categoryName, projectName, projectColor }: ShareData): Promise<void> {
  const colors = getThemeColors();
  const isExpense = transaction.type === 'expense';

  // Calculate dynamic height based on content
  const rows: [string, string][] = [];
  if (transaction.title || transaction.vendor) {
    rows.push(['Title', transaction.title || transaction.vendor]);
  }
  if (categoryName) rows.push(['Category', categoryName]);
  rows.push(['Date', `${formatDate(transaction.date)}, ${formatTime(transaction.time)}`]);
  rows.push(['Payment', transaction.paymentMethod === 'cash' ? 'Cash' : 'Online']);
  if (projectName) rows.push(['Project', projectName]);
  if (transaction.notes) rows.push(['Notes', transaction.notes]);

  const cardHeight = 80 + 90 + rows.length * LINE_HEIGHT + 20 + 40 + 16;

  const canvas = document.createElement('canvas');
  const scale = 2; // retina
  canvas.width = CARD_WIDTH * scale;
  canvas.height = cardHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Background with rounded corners
  roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, 16);
  ctx.fillStyle = colors.bg;
  ctx.fill();

  // Border
  roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, 16);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Header ──
  let y = 28;
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.text;
  ctx.fillText('FinTrack+', PADDING + 36, y + 4);

  // Small logo circle
  ctx.beginPath();
  ctx.arc(PADDING + 14, y - 2, 14, 0, Math.PI * 2);
  ctx.fillStyle = isExpense ? colors.expense : colors.income;
  ctx.fill();
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('F+', PADDING + 14, y + 2);
  ctx.textAlign = 'left';

  // Divider
  y += 20;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(CARD_WIDTH - PADDING, y);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Amount Section ──
  y += 30;
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.muted;
  ctx.textAlign = 'center';
  ctx.fillText(isExpense ? 'EXPENSE' : 'INCOME', CARD_WIDTH / 2, y);

  y += 32;
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillStyle = isExpense ? colors.expense : colors.income;
  const amountText = `${isExpense ? '-' : '+'}${formatCurrency(transaction.amount)}`;
  ctx.fillText(amountText, CARD_WIDTH / 2, y);
  ctx.textAlign = 'left';

  // ── Details ──
  y += 30;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(CARD_WIDTH - PADDING, y);
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  y += 22;
  for (const [label, value] of rows) {
    drawDetailRow(ctx, label, value, y, colors);
    y += LINE_HEIGHT;
  }

  // ── Footer ──
  y += 8;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(CARD_WIDTH - PADDING, y);
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  y += 24;
  ctx.font = '500 11px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.muted;
  ctx.textAlign = 'center';
  ctx.fillText('Tracked with FinTrack+', CARD_WIDTH / 2, y);
  ctx.textAlign = 'left';

  // Convert to blob and share
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });

  const file = new File([blob], `fintrack-${transaction.type}-${transaction.date}.png`, { type: 'image/png' });

  const title = transaction.title || transaction.vendor || (isExpense ? 'Expense' : 'Income');
  const shareText = `${title} — ${isExpense ? '-' : '+'}${formatCurrency(transaction.amount)}`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: shareText });
    } catch (e) {
      // User cancelled — ignore
      if ((e as Error).name !== 'AbortError') {
        downloadFallback(blob, file.name);
      }
    }
  } else {
    downloadFallback(blob, file.name);
  }
}

function downloadFallback(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
