// src/pages/orders/OrderDetailPage.jsx
import orderApi from '@/api/orderApi'
import { useEffect, useState, useRef } from 'react'
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
        const done   = idx <= currentIdx
        const active = idx === currentIdx
        const isLast = idx === STATUS_STEPS.length - 1

        return (
          <div key={step.key} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div className="flex-1 h-0.5 transition-all" style={{
                background: idx === 0 ? 'transparent' : done ? 'var(--color-primary)' : 'var(--color-border-subtle)',
              }} />
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{
                background: done ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                border: active ? '2.5px solid var(--color-primary)' : done ? 'none' : '1.5px solid var(--color-border-subtle)',
                boxShadow: active ? '0 0 0 3px var(--color-primary-subtle)' : 'none',
              }}>
                {done && !active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {active && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fff' }} />}
                {!done && !active && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />}
              </div>
              <div className="flex-1 h-0.5 transition-all" style={{
                background: isLast ? 'transparent' : idx < currentIdx ? 'var(--color-primary)' : 'var(--color-border-subtle)',
              }} />
            </div>
            <p className="text-xs mt-2 text-center" style={{
              color: done ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: active ? 600 : done ? 500 : 400,
            }}>
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
  const [copied, setCopied]     = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [qrError, setQrError]   = useState(false)
  const [showQr, setShowQr]     = useState(true)
  const [paid, setPaid]         = useState(false)
  const [closing, setClosing]   = useState(false)
  const { fetchOrderDetail }    = useOrderStore()
  const paidRef                 = useRef(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !paid) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, paid])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (paidRef.current) return
      try {
        const res = await orderApi.getOrderDetail(order.id)
        if (res.data.paymentStatus === 'PAID') {
          paidRef.current = true
          setPaid(true)
          clearInterval(interval)
          setTimeout(() => {
            setClosing(true)
            setTimeout(async () => {
              await fetchOrderDetail(order.id)
              onClose()
            }, 400)
          }, 2500)
        }
      } catch { }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(order.orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrUrl = getQrUrl(order.totalAmount, order.orderCode)

  return (
    <div
      onClick={paid ? undefined : onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        animation: closing ? 'fadeOut 0.4s ease forwards' : 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] overflow-hidden shadow-2xl"
        style={{ background: 'var(--color-bg-elevated)', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: '1px solid var(--color-border-subtle)',
            background: paid ? '#f0fdf4' : '#fef3c7',
            transition: 'background 0.4s ease',
          }}
        >
          <div className="flex items-center gap-2">
            {paid ? (
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute', width: 36, height: 36, borderRadius: '50%',
                  background: '#dcfce7',
                  animation: 'osm-ripple 1.2s ease-out 0.1s both',
                }} />
                <div style={{
                  position: 'relative', width: 32, height: 32, borderRadius: '50%',
                  background: '#16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'osm-circle-in 0.4s cubic-bezier(0.34,1.3,0.64,1) both',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline className="osm-check" points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 18 }}>⏳</span>
            )}
            <div>
              <p className="text-sm font-semibold" style={{
                color: paid ? '#16a34a' : '#92400e',
                transition: 'color 0.3s ease',
              }}>
                {paid ? 'Thanh toán thành công!' : 'Chờ thanh toán'}
              </p>
              <p className="text-xs font-mono mt-0.5" style={{ color: paid ? '#16a34a99' : '#b45309' }}>
                {paid ? 'Đang cập nhật đơn hàng...' : `#${order.orderCode}`}
              </p>
            </div>
          </div>
          {!paid && (
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
          )}
        </div>

        {/* Body */}
        {paid ? (
          <div className="flex flex-col items-center gap-4 px-6 py-8" style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold text-base mb-1" style={{ color: '#16a34a' }}>Đã nhận được thanh toán!</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Chúng tôi đã nhận được tiền chuyển khoản của bạn.<br />
                Đơn hàng sẽ được xác nhận và xử lý sớm nhất.
              </p>
            </div>
            <div
              className="w-full flex justify-between items-center px-4 py-3 rounded-[var(--radius-md)]"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <span className="text-sm" style={{ color: '#16a34a' }}>Số tiền đã thanh toán</span>
              <span className="font-bold text-sm" style={{ color: '#16a34a' }}>{fmt(order.totalAmount)}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Tự động chuyển về đơn hàng...</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeOut  { from { opacity: 1 } to { opacity: 0 } }
        @keyframes slideUp  { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes osm-ripple {
          0%   { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes osm-circle-in {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
        .osm-check {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: osm-check-draw 0.4s ease 0.3s forwards;
        }
        @keyframes osm-check-draw {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Cancel Modal ───────────────────────────────────────────────────
const CANCEL_REASONS = [
  'Tôi muốn thay đổi sản phẩm / biến thể',
  'Tôi muốn thay đổi địa chỉ giao hàng',
  'Tôi tìm được giá tốt hơn ở nơi khác',
  'Tôi đặt nhầm sản phẩm',
  'Giao hàng quá lâu',
  'Lý do khác',
]

function CancelModal({ onConfirm, onClose, cancelling, isBankTransfer }) {
  const [selected, setSelected] = useState(null)
  const [custom, setCustom]     = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isOther   = selected === 'Lý do khác'
  const reason    = isOther ? custom.trim() : selected
  const canSubmit = selected && (!isOther || custom.trim().length > 0)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-[var(--radius-lg)] overflow-hidden shadow-2xl"
        style={{ background: 'var(--color-bg-elevated)', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border-subtle)', background: '#fef2f2' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#fee2e2' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>Huỷ đơn hàng</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors"
            style={{ background: '#fee2e2', color: '#dc2626' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
            onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">

          {/* Warning banner cho chuyển khoản */}
          {isBankTransfer && (
            <div
              className="flex gap-2 px-3 py-2.5 rounded-[var(--radius-md)]"
              style={{ background: '#fefce8', border: '1px solid #fde047' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#854d0e" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: '#854d0e' }}>
                Nếu bạn đã chuyển khoản, vui lòng liên hệ hỗ trợ sau khi huỷ để được hoàn tiền thủ công.
              </p>
            </div>
          )}

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Vui lòng chọn lý do huỷ đơn để chúng tôi cải thiện dịch vụ tốt hơn.
          </p>

          <div className="flex flex-col gap-1.5">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => { setSelected(r); setCustom('') }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-left text-sm cursor-pointer transition-all"
                style={{
                  border: selected === r ? '1.5px solid #ef4444' : '1px solid var(--color-border-subtle)',
                  background: selected === r ? '#fef2f2' : 'transparent',
                  color: selected === r ? '#dc2626' : 'var(--color-text-primary)',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    border: selected === r ? '2px solid #ef4444' : '1.5px solid var(--color-border-subtle)',
                    background: selected === r ? '#ef4444' : 'transparent',
                  }}
                >
                  {selected === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                {r}
              </button>
            ))}
          </div>

          {isOther && (
            <textarea
              autoFocus
              rows={3}
              placeholder="Nhập lý do của bạn..."
              value={custom}
              onChange={e => setCustom(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] resize-none transition-colors"
              style={{
                border: '1px solid var(--color-border-subtle)',
                background: 'var(--color-bg-muted)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#ef4444'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer transition-colors"
            style={{
              background: 'var(--color-bg-muted)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Giữ đơn
          </button>
          <button
            onClick={() => canSubmit && !cancelling && onConfirm(reason)}
            disabled={!canSubmit || cancelling}
            className="flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold text-white cursor-pointer disabled:opacity-40 transition-opacity"
            style={{ background: '#ef4444' }}
          >
            {cancelling ? 'Đang huỷ...' : 'Xác nhận huỷ'}
          </button>
        </div>
      </div>

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
  const [showCancelModal, setShowCancelModal]   = useState(false)

  const canPay = ['BANK_TRANSFER', 'MOMO', 'VNPAY'].includes(o.paymentMethod)
    && o.paymentStatus === 'PENDING'
    && o.status !== 'CANCELLED'

  return (
    <>
      <div className="sticky top-[84px] flex flex-col gap-4">
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

          <div className="px-5 pb-4 flex flex-col gap-1.5">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Phương thức thanh toán</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {PAYMENT_METHOD[o.paymentMethod] || o.paymentMethod}
            </p>
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

          <div className="px-5 pb-5 flex flex-col gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="w-full py-2.5 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer transition-colors"
              style={{ background: 'var(--color-bg-muted)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
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
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
                className="w-full py-2 text-sm font-medium cursor-pointer disabled:opacity-50 rounded-[var(--radius-md)] transition-colors"
                style={{ color: '#ef4444', background: '#ef444410', border: '1px solid #ef444425' }}
              >
                {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
              </button>
            )}
          </div>

          {/* Lý do huỷ — hiện khi đã CANCELLED và có cancelReason */}
          {o.status === 'CANCELLED' && o.cancelReason && (
            <div
              className="mx-5 mb-5 px-3 py-2.5 rounded-[var(--radius-md)]"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <p className="text-xs font-medium mb-0.5" style={{ color: '#dc2626' }}>Lý do huỷ</p>
              <p className="text-xs" style={{ color: '#b91c1c' }}>{o.cancelReason}</p>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal order={o} onClose={() => setShowPaymentModal(false)} />
      )}

      {showCancelModal && (
        <CancelModal
          cancelling={cancelling}
          isBankTransfer={o.paymentMethod === 'BANK_TRANSFER'}
          onClose={() => setShowCancelModal(false)}
          onConfirm={async (reason) => {
            await onCancel(reason)
            setShowCancelModal(false)
          }}
        />
      )}
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { orderId }  = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const fromCheckout = location.state?.fromCheckout

  const { currentOrder, loading, error, fetchOrderDetail, cancelOrder } = useOrderStore()
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => { fetchOrderDetail(orderId) }, [orderId])

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
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{error || 'Không tìm thấy đơn hàng'}</p>
        <button onClick={() => navigate('/orders')} className="text-sm underline cursor-pointer" style={{ color: 'var(--color-primary)' }}>
          Về danh sách đơn hàng
        </button>
      </div>
    )
  }

  const o    = currentOrder
  const addr = o.shippingAddress

  const handleCancel = async (reason) => {
    setCancelling(true)
    try {
      await cancelOrder(o.id, reason)
    } catch (e) {
      alert(e.message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">

        <nav className="flex items-center gap-1.5 text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span className="opacity-50">/</span>
          <Link to="/orders" className="hover:text-[var(--color-primary)] transition-colors">Đơn hàng của tôi</Link>
          <span className="opacity-50">/</span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{o.orderCode}</span>
        </nav>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-bold leading-tight" style={{
              fontSize: '1.6rem', letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
            }}>
              Đơn hàng{' '}
              <span className="font-mono" style={{ color: 'var(--color-primary)' }}>{o.orderCode}</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Đặt lúc {formatDate(o.createdAt)}</p>
          </div>
          <StatusBadge status={o.status} />
        </div>

        {fromCheckout && o.status !== 'CANCELLED' && (
          <div className="mb-5 px-4 py-3 rounded-[var(--radius-md)] text-sm"
            style={{ background: '#16a34a15', border: '1px solid #16a34a30', color: '#16a34a' }}>
            🎉 Đặt hàng thành công! Chúng tôi sẽ xác nhận đơn của bạn sớm nhất.
          </div>
        )}

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            <div className="rounded-[var(--radius-lg)] p-5"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <p className="text-sm font-semibold mb-5" style={{ color: 'var(--color-text-primary)' }}>Trạng thái đơn hàng</p>
              <OrderStepper status={o.status} />
            </div>

            <div className="rounded-[var(--radius-lg)] overflow-hidden"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sản phẩm ({o.items?.length})</p>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                {o.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                    <img src={item.imageUrl || '/placeholder.png'} alt={item.productName}
                      className="w-14 h-14 rounded-[var(--radius-sm)] object-cover flex-shrink-0"
                      style={{ border: '1px solid var(--color-border-subtle)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.variantName}</p>
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

            <div className="rounded-[var(--radius-lg)] p-5"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
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
                <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-muted)' }}>Ghi chú: {o.note}</p>
              )}
            </div>

          </div>

          <div className="w-80 flex-shrink-0">
            <OrderSummary o={o} onCancel={handleCancel} cancelling={cancelling} />
          </div>
        </div>
      </div>
    </div>
  )
}