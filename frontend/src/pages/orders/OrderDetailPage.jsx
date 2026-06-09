// src/pages/orders/OrderDetailPage.jsx

import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import useOrderStore from '@/store/useOrderStore'
import {
  fmt, formatDate, PAYMENT_STATUS, PAYMENT_METHOD,
  StatusBadge, Icon,
  BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_NAME, getQrUrl,
} from './orderHelpers'

// ── Order Status Stepper ───────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'PENDING',   label: 'Đã đặt hàng' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'SHIPPING',  label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Hoàn tất' },
]

function OrderStepper({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)]"
        style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
      >
        <span className="text-base">❌</span>
        <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>Đơn hàng đã bị huỷ</p>
      </div>
    )
  }

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status)

  return (
    <div className="flex items-start gap-0 w-full">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx
        const active = idx === currentIdx
        const isLast = idx === STATUS_STEPS.length - 1

        return (
          <div key={step.key} className="flex flex-col items-center flex-1">
            {/* Circle + line */}
            <div className="flex items-center w-full">
              {/* Left line */}
              <div
                className="flex-1 h-0.5 transition-all"
                style={{
                  background: idx === 0 ? 'transparent' : done ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                }}
              />
              {/* Circle */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: done ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                  border: active ? '2.5px solid var(--color-primary)' : done ? 'none' : '1.5px solid var(--color-border-subtle)',
                  boxShadow: active ? '0 0 0 3px var(--color-primary-subtle)' : 'none',
                }}
              >
                {done && !active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {active && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fff' }} />
                )}
                {!done && !active && (
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                )}
              </div>
              {/* Right line */}
              <div
                className="flex-1 h-0.5 transition-all"
                style={{
                  background: isLast ? 'transparent' : idx < currentIdx ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                }}
              />
            </div>
            {/* Label */}
            <p
              className="text-xs mt-2 text-center"
              style={{
                color: done ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: active ? 600 : done ? 500 : 400,
              }}
            >
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Payment Modal ──────────────────────────────────────────────────
function PaymentModal({ order, onClose }) {
  const [copied, setCopied] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [qrError, setQrError] = useState(false)
  const [showQr, setShowQr] = useState(true)

  // Đóng khi bấm Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(order.orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrUrl = getQrUrl(order.totalAmount, order.orderCode)

  return (
    // Backdrop
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Modal card — stopPropagation để click bên trong không đóng */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] overflow-hidden shadow-2xl"
        style={{
          background: 'var(--color-bg-elevated)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border-subtle)', background: '#fef3c7' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Thanh toán đơn hàng</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: '#b45309' }}>#{order.orderCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors"
            style={{ background: '#fde68a', color: '#92400e' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fcd34d'}
            onMouseLeave={e => e.currentTarget.style.background = '#fde68a'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Toggle QR / Thủ công */}
        <div className="px-5 pt-4">
          <div
            className="flex rounded-[var(--radius-md)] overflow-hidden"
            style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-muted)' }}
          >
            {[{ key: true, label: '📷 Quét QR' }, { key: false, label: '🏦 Thủ công' }].map(({ key, label }) => (
              <button
                key={String(key)}
                onClick={() => setShowQr(key)}
                className="flex-1 py-2 text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: showQr === key ? 'var(--color-primary)' : 'transparent',
                  color: showQr === key ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {showQr ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="rounded-[var(--radius-md)] overflow-hidden flex items-center justify-center"
                style={{ width: 220, height: qrLoaded ? 'auto' : 220, background: '#fff', border: '1.5px solid var(--color-border-subtle)' }}
              >
                {qrError ? (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <span style={{ fontSize: 28 }}>⚠️</span>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Không tải được QR</p>
                  </div>
                ) : (
                  <>
                    {!qrLoaded && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 animate-spin"
                          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                      </div>
                    )}
                    <img src={qrUrl} alt="VietQR"
                      style={{ width: 220, display: qrLoaded ? 'block' : 'none' }}
                      onLoad={() => setQrLoaded(true)}
                      onError={() => setQrError(true)}
                    />
                  </>
                )}
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Hỗ trợ tất cả app ngân hàng Việt Nam
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Ngân hàng',     value: BANK_NAME },
                { label: 'Số tài khoản',  value: ACCOUNT_NUMBER, mono: true },
                { label: 'Chủ tài khoản', value: ACCOUNT_NAME },
                { label: 'Số tiền',       value: fmt(order.totalAmount), highlight: true },
              ].map(({ label, value, mono, highlight }) => (
                <div key={label} className="flex justify-between items-center py-1.5"
                  style={{ borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                  <span className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
                    style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Nội dung CK */}
          <div
            className="flex justify-between items-center px-3 py-2.5 rounded-[var(--radius-md)]"
            style={{ background: 'var(--color-primary-subtle)', border: '1.5px solid var(--color-primary)' }}
          >
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Nội dung chuyển khoản</p>
              <p className="font-mono font-bold text-sm mt-0.5" style={{ color: 'var(--color-primary)' }}>
                {order.orderCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-all flex-shrink-0"
              style={{ background: copied ? '#16a34a' : 'var(--color-primary)', color: '#fff' }}
            >
              {copied ? '✓ Đã copy' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: '#b45309' }}>
            ⚠️ Ghi đúng nội dung để đơn được xác nhận tự động
          </p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}

// ── Sidebar tóm tắt ────────────────────────────────────────────────
function OrderSummary({ o, onCancel, cancelling }) {
  const navigate = useNavigate()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const canPay = ['BANK_TRANSFER', 'MOMO', 'VNPAY'].includes(o.paymentMethod)
    && o.paymentStatus === 'PENDING'

  return (
    <>
      <div className="sticky top-[84px] flex flex-col gap-4">

        {/* ── Tóm tắt ── */}
        <div
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tóm tắt</p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>Tạm tính</span>
              <span>{fmt(o.subtotal)}</span>
            </div>
            {o.discountAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Giảm giá {o.promoCode && <span className="font-mono">({o.promoCode})</span>}
                </span>
                <span style={{ color: '#16a34a' }}>-{fmt(o.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>Phí vận chuyển</span>
              <span style={{ color: o.shippingFee === 0 ? '#16a34a' : 'inherit' }}>
                {o.shippingFee === 0 ? 'Miễn phí' : fmt(o.shippingFee)}
              </span>
            </div>
            <div
              className="flex justify-between pt-2.5 font-semibold text-base"
              style={{ borderTop: '1px solid var(--color-border-subtle)' }}
            >
              <span>Tổng cộng</span>
              <span style={{ color: 'var(--color-primary)' }}>{fmt(o.totalAmount)}</span>
            </div>
          </div>

          {/* Phương thức thanh toán + nút Thanh toán ngay */}
          <div className="px-5 pb-4 flex flex-col gap-1.5">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Phương thức thanh toán</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {PAYMENT_METHOD[o.paymentMethod] || o.paymentMethod}
            </p>

            {/* Trạng thái TT + nút nếu còn pending */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium" style={{ color: PAYMENT_STATUS[o.paymentStatus]?.color || '#6b7280' }}>
                {PAYMENT_STATUS[o.paymentStatus]?.label || o.paymentStatus}
              </p>
              {canPay && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-md)] cursor-pointer transition-all flex-shrink-0"
                  style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fde68a'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fef3c7'}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Thanh toán ngay
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex flex-col gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="w-full py-2.5 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer transition-colors"
              style={{
                background: 'var(--color-bg-muted)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Về danh sách đơn
            </button>
            <button
              onClick={() => navigate('/products')}
              className="w-full py-2.5 rounded-[var(--radius-md)] text-sm font-semibold text-white cursor-pointer transition-colors"
              style={{ background: 'var(--color-primary)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Tiếp tục mua sắm
            </button>
            {o.status === 'PENDING' && (
              <button
                onClick={onCancel}
                disabled={cancelling}
                className="w-full py-2 text-sm font-medium cursor-pointer disabled:opacity-50 rounded-[var(--radius-md)]"
                style={{ color: '#ef4444', background: '#ef444410', border: '1px solid #ef444425' }}
              >
                {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showPaymentModal && (
        <PaymentModal order={o} onClose={() => setShowPaymentModal(false)} />
      )}
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromCheckout = location.state?.fromCheckout

  const { currentOrder, loading, error, fetchOrderDetail, cancelOrder } = useOrderStore()
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchOrderDetail(orderId)
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !currentOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {error || 'Không tìm thấy đơn hàng'}
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="text-sm underline cursor-pointer"
          style={{ color: 'var(--color-primary)' }}
        >
          Về danh sách đơn hàng
        </button>
      </div>
    )
  }

  const o = currentOrder
  const addr = o.shippingAddress

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này không?')) return
    setCancelling(true)
    try {
      await cancelOrder(o.id)
    } catch (e) {
      alert(e.message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span className="opacity-50">/</span>
          <Link to="/orders" className="hover:text-[var(--color-primary)] transition-colors">Đơn hàng của tôi</Link>
          <span className="opacity-50">/</span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {o.orderCode}
          </span>
        </nav>

        {/* ── Page title ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="font-bold leading-tight"
              style={{
                fontSize: '1.6rem',
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)',
                fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
              }}
            >
              Đơn hàng{' '}
              <span className="font-mono" style={{ color: 'var(--color-primary)' }}>
                {o.orderCode}
              </span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Đặt lúc {formatDate(o.createdAt)}
            </p>
          </div>
          <StatusBadge status={o.status} />
        </div>

        {/* ── Success banner ── */}
        {fromCheckout && (
          <div
            className="mb-5 px-4 py-3 rounded-[var(--radius-md)] text-sm"
            style={{ background: '#16a34a15', border: '1px solid #16a34a30', color: '#16a34a' }}
          >
            🎉 Đặt hàng thành công! Chúng tôi sẽ xác nhận đơn của bạn sớm nhất.
          </div>
        )}

        {/* ── 2-col layout ── */}
        <div className="flex gap-6 items-start">

          {/* ── LEFT column ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Trạng thái đơn hàng */}
            <div
              className="rounded-[var(--radius-lg)] p-5"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
            >
              <p className="text-sm font-semibold mb-5" style={{ color: 'var(--color-text-primary)' }}>
                Trạng thái đơn hàng
              </p>
              <OrderStepper status={o.status} />
            </div>

            {/* Sản phẩm */}
            <div
              className="rounded-[var(--radius-lg)] overflow-hidden"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
            >
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Sản phẩm ({o.items?.length})
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                {o.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                    <img
                      src={item.imageUrl || '/placeholder.png'}
                      alt={item.productName}
                      className="w-14 h-14 rounded-[var(--radius-sm)] object-cover flex-shrink-0"
                      style={{ border: '1px solid var(--color-border-subtle)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {fmt(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                      {fmt(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Địa chỉ giao hàng */}
            <div
              className="rounded-[var(--radius-lg)] p-5"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Địa chỉ giao hàng
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{addr?.fullName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {addr?.phone}{addr?.email ? ` · ${addr.email}` : ''}
              </p>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {addr?.detail}, {addr?.ward}, {addr?.district}, {addr?.province}
              </p>
              {o.note && (
                <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-muted)' }}>
                  Ghi chú: {o.note}
                </p>
              )}
            </div>

          </div>

          {/* ── RIGHT column — sticky sidebar ── */}
          <div className="w-80 flex-shrink-0">
            <OrderSummary
              o={o}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          </div>

        </div>
      </div>
    </div>
  )
}