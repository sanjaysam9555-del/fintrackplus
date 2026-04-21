import { Transaction } from './types';
import { formatCurrency, formatTime } from './constants';

interface ShareData {
  transaction: Transaction;
  categoryName?: string;
  projectName?: string;
  projectColor?: string;
  vendorName?: string;
  partnerName?: string;
  partnerColor?: string;
  orgName?: string;
  orgLogoUrl?: string | null;
}

const CARD_WIDTH = 400;
const PADDING = 24;
const LINE_HEIGHT = 28;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShareDate(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = DAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  const formattedTime = formatTime(timeStr);
  return `${day}, ${d} ${month} ${y}, ${formattedTime}`;
}

function formatFilenameDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const month = MONTHS[m - 1];
  return `${d} ${month} ${y}`;
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
}

function getThemeColors() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    return {
      bg: '#0a0a0a', card: '#141414', text: '#f5f5f5', muted: '#a1a1aa',
      border: '#27272a', expense: '#ef4444', income: '#22c55e',
    };
  }
  return {
    bg: '#ffffff', card: '#f8f9fa', text: '#18181b', muted: '#71717a',
    border: '#e4e4e7', expense: '#dc2626', income: '#16a34a',
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
  const maxWidth = CARD_WIDTH - PADDING * 2 - 120;
  let displayValue = value;
  while (ctx.measureText(displayValue).width > maxWidth && displayValue.length > 3) {
    displayValue = displayValue.slice(0, -4) + '...';
  }
  ctx.fillText(displayValue, PADDING + 110, y);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function shareTransaction({ transaction, categoryName, projectName, vendorName, partnerName, partnerColor, orgName, orgLogoUrl }: ShareData): Promise<void> {
  const colors = getThemeColors();
  const isExpense = transaction.type === 'expense';
  const organizationName = orgName?.trim() || '';
  const hasOrgBranding = Boolean(organizationName || orgLogoUrl);

  // Build rows
  const rows: [string, string][] = [];
  if (transaction.title || transaction.vendor) {
    rows.push(['Title', transaction.title || transaction.vendor]);
  }
  if (vendorName || transaction.vendor) {
    const vendor = vendorName || transaction.vendor;
    if (vendor !== (transaction.title || '')) {
      rows.push(['Vendor', vendor]);
    }
  }
  if (categoryName) rows.push(['Category', categoryName]);
  rows.push(['Date', formatShareDate(transaction.date, transaction.time)]);
  rows.push(['Payment', transaction.paymentMethod === 'cash' ? 'Cash' : 'Online']);
  if (projectName) rows.push(['Project', projectName]);
  if (partnerName) rows.push(['Handled By', partnerName]);
  if (transaction.isGst) rows.push(['GST', 'Included']);
  if (transaction.notes) rows.push(['Notes', transaction.notes]);

  const headerHeight = hasOrgBranding ? 78 : 48;
  const cardHeight = headerHeight + 90 + rows.length * LINE_HEIGHT + 20 + 40 + 16;

  const canvas = document.createElement('canvas');
  const scale = 3;
  canvas.width = CARD_WIDTH * scale;
  canvas.height = cardHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Background
  roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, 16);
  ctx.fillStyle = colors.bg;
  ctx.fill();

  // Border
  roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, 16);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Header with app icon ──
  let y = 28;

  if (hasOrgBranding) {
    if (orgLogoUrl) {
      try {
        const logo = await loadImage(orgLogoUrl);
        const logoSize = 34;
        const logoX = PADDING;
        const logoY = y - 18;
        ctx.save();
        roundRect(ctx, logoX, logoY, logoSize, logoSize, 8);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch {
        ctx.beginPath();
        ctx.arc(PADDING + 17, y - 1, 17, 0, Math.PI * 2);
        ctx.fillStyle = isExpense ? colors.expense : colors.income;
        ctx.fill();
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText((organizationName || 'O').charAt(0).toUpperCase(), PADDING + 17, y + 4);
        ctx.textAlign = 'left';
      }
    }

    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = colors.text;
    const orgTextX = PADDING + (orgLogoUrl ? 46 : 0);
    let displayOrgName = organizationName || 'Organisation';
    const orgMaxWidth = CARD_WIDTH - orgTextX - PADDING;
    while (ctx.measureText(displayOrgName).width > orgMaxWidth && displayOrgName.length > 3) {
      displayOrgName = displayOrgName.slice(0, -4) + '...';
    }
    ctx.fillText(displayOrgName, orgTextX, y + 2);

    y += 24;
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = colors.muted;
    ctx.fillText('FinTrack⁺ transaction share', orgTextX, y);
  } else {
    // Try to load the real app icon
    try {
      const icon = await loadImage('/app-icon-192.png');
      const iconSize = 28;
      const iconX = PADDING;
      const iconY = y - 16;
      ctx.save();
      roundRect(ctx, iconX, iconY, iconSize, iconSize, 6);
      ctx.clip();
      ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } catch {
      // Fallback: draw a colored circle
      ctx.beginPath();
      ctx.arc(PADDING + 14, y - 2, 14, 0, Math.PI * 2);
      ctx.fillStyle = isExpense ? colors.expense : colors.income;
      ctx.fill();
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('F+', PADDING + 14, y + 2);
      ctx.textAlign = 'left';
    }

    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = colors.text;
    ctx.fillText('FinTrack+', PADDING + 36, y + 4);
  }

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

  const title = transaction.title || transaction.vendor || (isExpense ? 'Expense' : 'Income');
  const filenameParts = [organizationName && sanitizeFilenamePart(organizationName), sanitizeFilenamePart(title), formatFilenameDate(transaction.date), 'FinTrack+'].filter(Boolean);
  const filename = `${filenameParts.join(' - ')}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  const shareText = `${title} — ${isExpense ? '-' : '+'}${formatCurrency(transaction.amount)}`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: shareText });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        downloadFallback(blob, filename);
      }
    }
  } else {
    downloadFallback(blob, filename);
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
