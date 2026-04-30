import type { Bill } from '@/types';
import type { BillFeeItem } from '@/types';
import type { BillShareData } from '@/types/bills-share';

const CARD_WIDTH = 1080;
const CARD_PADDING_X = 72;
const CARD_PADDING_Y = 72;
const ROW_HEIGHT = 44;
const SECTION_GAP = 28;


function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatCurrency(value: number): string {
  return `¥${Number(value ?? 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMonthLabel(bill: Bill): string {
  return `${bill.bill_year}年${bill.bill_month}月账单`;
}

function formatStatusLabel(status: Bill['status']): string {
  const labels: Record<Bill['status'], string> = {
    pending: '待支付',
    partial: '部分支付',
    paid: '已支付',
    overdue: '已逾期',
  };
  return labels[status];
}

export function buildBillShareData({
  bill,
  organizationName,
  feeItems = [],
}: {
  bill: Bill;
  organizationName?: string | null;
  feeItems?: BillFeeItem[];
}): BillShareData {
  const roomLabel = bill.lease?.room
    ? `${bill.lease.room.apartment?.name ?? '未命名公寓'} ${bill.lease.room.room_number}`
    : '未绑定房间';
  const tenantName = bill.lease?.tenant?.name ?? '未绑定租客';
  const unpaidAmount = Math.max(0, Number(bill.total_amount) - Number(bill.paid_amount));

  const defaultBreakdown = [
    { label: '租金', value: formatCurrency(Number(bill.rent_amount)) },
    { label: '水费', value: formatCurrency(Number(bill.water_amount)) },
    { label: '电费', value: formatCurrency(Number(bill.electricity_amount)) },
    { label: '其他费用', value: formatCurrency(Number(bill.other_amount)) },
  ];

  const breakdown =
    feeItems.length > 0
      ? feeItems.slice(0, 4).map((item) => ({
          label: item.specification_name
            ? `${item.fee_name}(${item.specification_name})`
            : item.fee_name,
          value: formatCurrency(Number(item.amount)),
        }))
      : defaultBreakdown;

  return {
    organizationName: organizationName?.trim() || 'PropEase',
    monthLabel: formatMonthLabel(bill),
    roomLabel,
    tenantName,
    statusLabel: formatStatusLabel(bill.status),
    dueDate: bill.due_date,
    totalAmount: formatCurrency(Number(bill.total_amount)),
    paidAmount: formatCurrency(Number(bill.paid_amount)),
    unpaidAmount: formatCurrency(unpaidAmount),
    notes: bill.notes,
    breakdown,
  };
}

export function renderBillShareSvg(data: BillShareData): string {
  const breakdownRows = data.breakdown
    .map(
      (item, index) => `
      <g transform="translate(${CARD_PADDING_X}, ${314 + index * ROW_HEIGHT})">
        <text x="0" y="0" font-size="26" fill="#475569">${escapeXml(item.label)}</text>
        <text x="${CARD_WIDTH - CARD_PADDING_X * 2}" y="0" text-anchor="end" font-size="26" font-weight="700" fill="#0F172A">${escapeXml(item.value)}</text>
      </g>`
    )
    .join('');

  const notesSection = data.notes
    ? `
      <text x="${CARD_PADDING_X}" y="${494 + data.breakdown.length * ROW_HEIGHT}" font-size="24" fill="#64748B">备注</text>
      <foreignObject x="${CARD_PADDING_X}" y="${510 + data.breakdown.length * ROW_HEIGHT}" width="${CARD_WIDTH - CARD_PADDING_X * 2}" height="120">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:24px;line-height:1.6;color:#0F172A;font-family:'PingFang SC','Microsoft YaHei',sans-serif;word-break:break-word;">
          ${escapeXml(data.notes)}
        </div>
      </foreignObject>`
    : '';

  const contentBottom = 590 + data.breakdown.length * ROW_HEIGHT + (data.notes ? 120 : 0);
  const cardHeight = contentBottom + SECTION_GAP + CARD_PADDING_Y;

  return `
    <svg width="${CARD_WIDTH}" height="${cardHeight}" viewBox="0 0 ${CARD_WIDTH} ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CARD_WIDTH}" height="${cardHeight}" rx="48" fill="#F8FAFC"/>
      <rect x="24" y="24" width="${CARD_WIDTH - 48}" height="${cardHeight - 48}" rx="36" fill="white"/>
      <rect x="24" y="24" width="${CARD_WIDTH - 48}" height="220" rx="36" fill="url(#header-gradient)"/>
      <defs>
        <linearGradient id="header-gradient" x1="0" y1="0" x2="1080" y2="220" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0F172A"/>
          <stop offset="1" stop-color="#1D4ED8"/>
        </linearGradient>
      </defs>
      <text x="${CARD_PADDING_X}" y="92" font-size="30" font-weight="700" fill="rgba(255,255,255,0.84)">${escapeXml(data.organizationName)}</text>
      <text x="${CARD_PADDING_X}" y="144" font-size="52" font-weight="900" fill="white">${escapeXml(data.monthLabel)}</text>
      <text x="${CARD_PADDING_X}" y="188" font-size="26" fill="rgba(255,255,255,0.82)">${escapeXml(data.roomLabel)} · ${escapeXml(data.tenantName)}</text>
      <rect x="${CARD_WIDTH - 280}" y="72" width="184" height="56" rx="28" fill="rgba(255,255,255,0.16)"/>
      <text x="${CARD_WIDTH - 188}" y="108" text-anchor="middle" font-size="24" font-weight="700" fill="white">${escapeXml(data.statusLabel)}</text>

      <g transform="translate(${CARD_PADDING_X}, 290)">
        <text x="0" y="-24" font-size="24" fill="#64748B">费用构成</text>
      </g>
      ${breakdownRows}

      <g transform="translate(${CARD_PADDING_X}, ${254 + data.breakdown.length * ROW_HEIGHT + 80})">
        <rect x="0" y="0" width="${CARD_WIDTH - CARD_PADDING_X * 2}" height="168" rx="28" fill="#EFF6FF"/>
        <text x="28" y="52" font-size="24" fill="#64748B">账单合计</text>
        <text x="${CARD_WIDTH - CARD_PADDING_X * 2 - 28}" y="52" text-anchor="end" font-size="28" font-weight="800" fill="#0F172A">${escapeXml(data.totalAmount)}</text>
        <text x="28" y="98" font-size="24" fill="#64748B">已付金额</text>
        <text x="${CARD_WIDTH - CARD_PADDING_X * 2 - 28}" y="98" text-anchor="end" font-size="28" font-weight="800" fill="#059669">${escapeXml(data.paidAmount)}</text>
        <text x="28" y="144" font-size="24" fill="#64748B">待付金额 / 到期日</text>
        <text x="${CARD_WIDTH - CARD_PADDING_X * 2 - 28}" y="144" text-anchor="end" font-size="28" font-weight="800" fill="#DC2626">${escapeXml(data.unpaidAmount)} · ${escapeXml(data.dueDate)}</text>
      </g>

      ${notesSection}

      <text x="${CARD_PADDING_X}" y="${cardHeight - 54}" font-size="22" fill="#94A3B8">账单分享图由系统前端生成，请以系统内账单为准。</text>
    </svg>
  `.trim();
}

async function svgToPngFile(svg: string, fileName: string): Promise<File> {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = window.URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('分享图渲染失败'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('浏览器不支持分享图生成');
    }

    context.fillStyle = '#F8FAFC';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('分享图导出失败'));
      }, 'image/png');
    });

    return new File([pngBlob], fileName, { type: 'image/png' });
  } finally {
    window.URL.revokeObjectURL(url);
  }
}

export async function createBillShareFile(params: {
  bill: Bill;
  organizationName?: string | null;
  feeItems?: BillFeeItem[];
}): Promise<File> {
  const data = buildBillShareData(params);
  const safeRoomLabel = data.roomLabel.replaceAll(/[\\/:*?"<>|]/g, '-');
  return svgToPngFile(
    renderBillShareSvg(data),
    `账单分享_${data.monthLabel}_${safeRoomLabel}.png`
  );
}

function downloadFile(file: File) {
  const url = window.URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function shareBillSummary(params: {
  bill: Bill;
  organizationName?: string | null;
  feeItems?: BillFeeItem[];
}): Promise<'shared' | 'downloaded'> {
  const file = await createBillShareFile(params);

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      title: `${params.bill.bill_year}年${params.bill.bill_month}月账单`,
      text: '账单分享图',
      files: [file],
    });
    return 'shared';
  }

  downloadFile(file);
  return 'downloaded';
}
