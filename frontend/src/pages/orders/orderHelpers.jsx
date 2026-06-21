export const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

export const formatDate = (iso) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export const STATUS = {
  PENDING: { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6', bg: '#dbeafe' },
  SHIPPING: { label: 'Đang giao', color: '#8b5cf6', bg: '#ede9fe' },
  DELIVERED: { label: 'Đã giao', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã huỷ', color: '#ef4444', bg: '#fee2e2' },
}

export const PAYMENT_STATUS = {
  PENDING: { label: 'Chưa thanh toán', color: '#f59e0b' },
  PAID: { label: 'Đã thanh toán', color: '#16a34a' },
  REFUND_PENDING: { label: 'Đang hoàn tiền', color: '#f97316' },
  REFUNDED: { label: 'Đã hoàn tiền', color: '#8b5cf6' },
}

export const PAYMENT_METHOD = {
  COD: 'Tiền mặt khi nhận hàng',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

// ── Ai là người huỷ đơn — dùng cho OrderStepper, OrderSummary ──────────────
export const CANCELLED_BY = {
  CUSTOMER: {
    label: 'Bạn đã huỷ đơn',
    shortLabel: 'Đơn hàng đã bị huỷ',
    detail: null, // dùng o.cancelReason thay vì câu cố định
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    detailColor: '#b91c1c',
    icon: '❌',
  },
  SYSTEM: {
    label: 'Hệ thống tự huỷ',
    shortLabel: 'Đơn đã hết hạn thanh toán và bị huỷ tự động',
    detail: 'Đơn đã quá hạn 24 giờ mà chưa được thanh toán nên hệ thống tự động huỷ.',
    color: '#c2410c',
    bg: '#fff7ed',
    border: '#fed7aa',
    detailColor: '#92400e',
    icon: '⏱️',
  },
}

// ── Thông tin ngân hàng — single source of truth ─────────────────────────────
// BankTransferModal và PaymentModal đều import từ đây, không tự khai báo lại
export const BANK_BIN = '970436'
export const ACCOUNT_NUMBER = '1234567890'
export const ACCOUNT_NAME = 'NGUYEN VAN A'
export const BANK_NAME = 'Vietcombank'

export const getQrUrl = (amount, content) =>
  `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NUMBER}-compact2.png` +
  `?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`

// ── Format giây còn lại -> "HH:MM:SS" hoặc "MM:SS" ──────────────────────────
export const formatCountdown = (seconds) => {
  if (seconds === null || seconds === undefined || seconds < 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

// ── Tính số giây còn lại tới một mốc thời gian ISO ──────────────────────────
export const getSecondsUntil = (isoDate) => {
  if (!isoDate) return null
  return Math.floor((new Date(isoDate) - new Date()) / 1000)
}

export function StatusBadge({ status }) {
  const cfg = STATUS[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

export const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Package: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  QrCode: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
    </svg>
  ),
}