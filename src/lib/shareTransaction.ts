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

const CARD_WIDTH = 440;
const PADDING = 28;
const ROW_HEIGHT = 32;
const RADIUS = 20;
const TOP_BAR_HEIGHT = 6;
const HEADER_HEIGHT = 76;
const AMOUNT_SECTION_HEIGHT = 118;
const STATUS_BANNER_HEIGHT = 78;
const FOOTER_HEIGHT = 60;

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

function formatGeneratedTimestamp(): string {
  const now = new Date();
  const month = MONTHS[now.getMonth()];
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${now.getDate()} ${month} ${now.getFullYear()}, ${hour12}:${minutes} ${period}`;
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
}

function getThemeColors() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    return {
      bg: '#0a0a0a', bgTop: '#121214', card: '#18181b', text: '#f5f5f5', muted: '#a1a1aa',
      border: '#27272a', expense: '#f87171', income: '#4ade80',
      expenseSoft: '#f8717133', incomeSoft: '#4ade8033', primary: '#60a5fa',
    };
  }
  return {
    bg: '#ffffff', bgTop: '#fafafa', card: '#f8f9fa', text: '#18181b', muted: '#71717a',
    border: '#e4e4e7', expense: '#dc2626', income: '#16a34a',
    expenseSoft: '#fee2e2', incomeSoft: '#dcfce7', primary: '#2563eb',
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  // Progressive enhancement — silently ignored on engines without support (e.g. older WebKit)
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`;
}

function drawPillBadge(ctx: CanvasRenderingContext2D, text: string, centerX: number, centerY: number, accent: string, accentSoft: string) {
  ctx.font = '700 12px Inter, system-ui, sans-serif';
  setLetterSpacing(ctx, 1.2);
  const textWidth = ctx.measureText(text).width;
  const pillWidth = textWidth + 32;
  const pillHeight = 28;
  const pillX = centerX - pillWidth / 2;
  const pillY = centerY - pillHeight / 2;

  roundRect(ctx, pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
  ctx.fillStyle = accentSoft;
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, centerX, centerY + 1);
  ctx.textBaseline = 'alphabetic';
  setLetterSpacing(ctx, 0);
}

function drawCheckBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.45, cy + radius * 0.02);
  ctx.lineTo(cx - radius * 0.12, cy + radius * 0.35);
  ctx.lineTo(cx + radius * 0.48, cy - radius * 0.32);
  ctx.stroke();
}

function drawDetailRow(ctx: CanvasRenderingContext2D, label: string, value: string, y: number, colors: ReturnType<typeof getThemeColors>) {
  ctx.font = '500 13px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.muted;
  ctx.textAlign = 'left';
  ctx.fillText(label, PADDING + 20, y);

  ctx.fillStyle = colors.text;
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  const maxWidth = CARD_WIDTH - PADDING * 2 - 40 - 130;
  let displayValue = value;
  while (ctx.measureText(displayValue).width > maxWidth && displayValue.length > 3) {
    displayValue = displayValue.slice(0, -4) + '...';
  }
  ctx.textAlign = 'right';
  ctx.fillText(displayValue, CARD_WIDTH - PADDING - 20, y);
  ctx.textAlign = 'left';
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

export async function shareTransaction({ transaction, categoryName, projectName, vendorName, partnerName, orgName, orgLogoUrl }: ShareData): Promise<void> {
  const colors = getThemeColors();
  const isExpense = transaction.type === 'expense';
  const accent = isExpense ? colors.expense : colors.income;
  const accentSoft = isExpense ? colors.expenseSoft : colors.incomeSoft;
  const organizationName = orgName?.trim() || '';
  const hasOrgBranding = Boolean(organizationName || orgLogoUrl);

  // Build detail rows
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

  const detailsPanelHeight = 24 + rows.length * ROW_HEIGHT + 16;
  const cardHeight = TOP_BAR_HEIGHT + HEADER_HEIGHT + AMOUNT_SECTION_HEIGHT + STATUS_BANNER_HEIGHT + detailsPanelHeight + FOOTER_HEIGHT;

  const canvas = document.createElement('canvas');
  const scale = 3;
  canvas.width = CARD_WIDTH * scale;
  canvas.height = cardHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── Card background with soft elevation ──
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, RADIUS);
  ctx.fillStyle = colors.bg;
  ctx.fill();
  ctx.restore();

  roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, RADIUS);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Colored top accent bar — clipped to the card's own silhouette so the
  // rounded corners always match exactly, regardless of bar thickness ──
  ctx.save();
  roundRect(ctx, 0, 0, CARD_WIDTH, cardHeight, RADIUS);
  ctx.clip();
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, CARD_WIDTH, TOP_BAR_HEIGHT);
  ctx.restore();

  let y = TOP_BAR_HEIGHT + 34;

  // ── Header: brand identity ──
  if (hasOrgBranding) {
    if (orgLogoUrl) {
      try {
        const logo = await loadImage(orgLogoUrl);
        const logoSize = 44;
        const logoX = PADDING;
        const logoY = y - 22;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        roundRect(ctx, logoX, logoY, logoSize, logoSize, 11);
        ctx.fillStyle = colors.card;
        ctx.fill();
        ctx.restore();
        ctx.save();
        roundRect(ctx, logoX, logoY, logoSize, logoSize, 11);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch {
        ctx.beginPath();
        ctx.arc(PADDING + 22, y, 22, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
        ctx.font = 'bold 17px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((organizationName || 'O').charAt(0).toUpperCase(), PADDING + 22, y + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    const textX = PADDING + (orgLogoUrl ? 58 : 0);
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = colors.text;
    let displayOrgName = organizationName || 'Organisation';
    const orgMaxWidth = CARD_WIDTH - textX - PADDING;
    while (ctx.measureText(displayOrgName).width > orgMaxWidth && displayOrgName.length > 3) {
      displayOrgName = displayOrgName.slice(0, -4) + '...';
    }
    ctx.fillText(displayOrgName, textX, y - 4);

    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = colors.primary;
    ctx.fillText('FinTrack⁺', textX, y + 16);
    const fintrackWidth = ctx.measureText('FinTrack⁺').width;
    ctx.fillStyle = colors.muted;
    ctx.fillText(' · Digital Receipt', textX + fintrackWidth, y + 16);
  } else {
    try {
      const icon = await loadImage('/app-icon-192.png');
      const iconSize = 40;
      const iconX = PADDING;
      const iconY = y - 20;
      ctx.save();
      roundRect(ctx, iconX, iconY, iconSize, iconSize, 10);
      ctx.clip();
      ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } catch {
      ctx.beginPath();
      ctx.arc(PADDING + 20, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.font = 'bold 15px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F+', PADDING + 20, y + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = colors.text;
    ctx.fillText('FinTrack⁺', PADDING + 52, y - 4);
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = colors.muted;
    ctx.fillText('Digital Transaction Receipt', PADDING + 52, y + 16);
  }

  y += 42;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(CARD_WIDTH - PADDING, y);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Amount section, with a soft radial glow behind it ──
  const amountCenterY = y + AMOUNT_SECTION_HEIGHT / 2 + 6;
  const glow = ctx.createRadialGradient(CARD_WIDTH / 2, amountCenterY, 10, CARD_WIDTH / 2, amountCenterY, 140);
  glow.addColorStop(0, hexToRgba(accent, 0.12));
  glow.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, y, CARD_WIDTH, AMOUNT_SECTION_HEIGHT);

  y += 40;
  drawPillBadge(ctx, isExpense ? 'EXPENSE' : 'INCOME', CARD_WIDTH / 2, y, accent, accentSoft);

  y += 50;
  ctx.font = '800 40px Inter, system-ui, sans-serif';
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  const amountText = `${isExpense ? '-' : '+'}${formatCurrency(transaction.amount)}`;
  ctx.fillText(amountText, CARD_WIDTH / 2, y);
  ctx.textAlign = 'left';

  y += AMOUNT_SECTION_HEIGHT - 90;

  // ── Status confirmation banner ──
  const bannerY = y;
  const bannerHeight = STATUS_BANNER_HEIGHT - 20;
  roundRect(ctx, PADDING, bannerY, CARD_WIDTH - PADDING * 2, bannerHeight, 14);
  ctx.fillStyle = colors.incomeSoft;
  ctx.fill();

  const badgeCx = PADDING + 28;
  const badgeCy = bannerY + bannerHeight / 2;
  drawCheckBadge(ctx, badgeCx, badgeCy, 15, colors.income);

  const statusTextX = badgeCx + 26;
  ctx.font = '700 14px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.text;
  ctx.fillText(isExpense ? 'Payment completed' : 'Payment received', statusTextX, badgeCy - 2);
  ctx.font = '500 11.5px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.muted;
  ctx.fillText('Recorded and settled in FinTrack⁺', statusTextX, badgeCy + 15);

  y = bannerY + bannerHeight + 24;

  // ── Details panel ──
  roundRect(ctx, PADDING, y, CARD_WIDTH - PADDING * 2, detailsPanelHeight - 8, 14);
  ctx.fillStyle = colors.card;
  ctx.fill();

  y += 24;
  for (const [label, value] of rows) {
    drawDetailRow(ctx, label, value, y, colors);
    y += ROW_HEIGHT;
  }

  y += 8;

  // ── Footer ──
  y += 8;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(CARD_WIDTH - PADDING, y);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  y += 26;
  const footerBrand = 'FinTrack⁺';
  const footerRest = ` · Generated ${formatGeneratedTimestamp()}`;
  ctx.font = '700 11.5px Inter, system-ui, sans-serif';
  const footerBrandWidth = ctx.measureText(footerBrand).width;
  ctx.font = '500 11.5px Inter, system-ui, sans-serif';
  const footerRestWidth = ctx.measureText(footerRest).width;
  const footerStartX = CARD_WIDTH / 2 - (footerBrandWidth + footerRestWidth) / 2;

  ctx.textAlign = 'left';
  ctx.font = '700 11.5px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.primary;
  ctx.fillText(footerBrand, footerStartX, y);
  ctx.font = '500 11.5px Inter, system-ui, sans-serif';
  ctx.fillStyle = colors.muted;
  ctx.fillText(footerRest, footerStartX + footerBrandWidth, y);

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
