// src/pages/orders/OrderDetailPage.jsx

import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useOrderStore from '@/store/useOrderStore'
import { usePageReady } from '@/hooks/usePageReady'
import {
  fmt, formatDate, PAYMENT_STATUS, PAYMENT_METHOD,
  StatusBadge, Icon,
  BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_NAME, getQrUrl,
} from './orderHelpers'

// ── Bank Transfer Section ──────────────────────────────────────────
function BankTransferPending({ order }) {
  const [copied, setCopied] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [qrError, setQrError] = useState(false)
  const [showQr, setShowQr] = useState(true)

  const handleCopy = () => {
    navigator.clipboard.writeText(order.orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrUrl = getQrUrl(order.totalAmount, order.orderCode)

  return (
    <div
      className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{ border: '1.5px solid #f59e0b', background: '#fffbeb' }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a' }}
      >
        <span style={{ fontSize: 16 }}>⏳</span>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
            Chờ thanh toán chuyển khoản
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
            Vui lòng chuyển khoản để đơn hàng được xác nhận
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div
          className="flex rounded-[var(--radius-md)] overflow-hidden self-center"
          style={{ border: '1.5px solid var(--color-border-subtle)', background: 'var(--color-bg-muted)' }}
        >
          {[{ key: true, label: '📷 Quét QR' }, { key: false, label: '🏦 Thủ công' }].map(({ key, label }) => (
            <button
              key={String(key)}
              onClick={() => setShowQr(key)}
              className="px-4 py-1.5 text-xs font-medium cursor-pointer transition-all"
              style={{
                background: showQr === key ? 'var(--color-primary)' : 'transparent',
                color: showQr === key ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {showQr ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="rounded-[var(--radius-md)] overflow-hidden flex items-center justify-center"
              style={{
                width: 200,
                height: qrLoaded ? 'auto' : 200,
                background: '#fff',
                border: '1.5px solid var(--color-border-subtle)',
              }}
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
                      <div
                        className="w-6 h-6 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                      />
                    </div>
                  )}
                  <img
                    src={qrUrl}
                    alt="VietQR"
                    style={{ width: 200, display: qrLoaded ? 'block' : 'none' }}
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
              { label: 'Ngân hàng',      value: BANK_NAME },
              { label: 'Số tài khoản',   value: ACCOUNT_NUMBER, mono: true },
              { label: 'Chủ tài khoản',  value: ACCOUNT_NAME },
              { label: 'Số tiền',        value: fmt(order.totalAmount), highlight: true },
            ].map(({ label, value, mono, highlight }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#92400e' }}>{label}</span>
                <span
                  className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
                  style={{ color: highlight ? 'var(--color-primary)' : '#1c1917' }}
                >
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
            className="text-xs font-medium px-2.5 py-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-all flex-shrink-0"
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
  const showBankPending = o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'PENDING'

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
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--color-bg-surface)' }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-[var(--radius-md)] cursor-pointer"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
          >
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Chi tiết đơn hàng
            </h1>
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
              #{o.orderCode}
            </p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={o.status} />
          </div>
        </div>

        {fromCheckout && (
          <div
            className="px-4 py-3 rounded-[var(--radius-md)] text-sm"
            style={{ background: '#16a34a15', border: '1px solid #16a34a30', color: '#16a34a' }}
          >
            🎉 Đặt hàng thành công! Chúng tôi sẽ xác nhận đơn của bạn sớm nhất.
          </div>
        )}

        {showBankPending && <BankTransferPending order={o} />}

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
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="rounded-[var(--radius-lg)] p-4"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Địa chỉ giao hàng
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{addr?.fullName}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{addr?.phone}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {addr?.detail}, {addr?.ward}, {addr?.district}, {addr?.province}
            </p>
          </div>

          <div
            className="rounded-[var(--radius-lg)] p-4"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Thanh toán
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {PAYMENT_METHOD[o.paymentMethod] || o.paymentMethod}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: PAYMENT_STATUS[o.paymentStatus]?.color || '#6b7280' }}>
              {PAYMENT_STATUS[o.paymentStatus]?.label || o.paymentStatus}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(o.createdAt)}
            </p>
          </div>
        </div>

        <div
          className="rounded-[var(--radius-lg)] p-5"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex flex-col gap-2 text-sm">
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
              className="flex justify-between pt-2 font-semibold text-base"
              style={{ borderTop: '1px solid var(--color-border-subtle)' }}
            >
              <span>Tổng cộng</span>
              <span style={{ color: 'var(--color-primary)' }}>{fmt(o.totalAmount)}</span>
            </div>
          </div>
        </div>

        {o.note && (
          <div
            className="rounded-[var(--radius-md)] px-4 py-3 text-sm"
            style={{ background: 'var(--color-bg-muted)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
          >
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Ghi chú: </span>
            {o.note}
          </div>
        )}

        {o.status === 'PENDING' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="self-start text-sm font-medium cursor-pointer disabled:opacity-50 px-4 py-2 rounded-[var(--radius-md)]"
            style={{ color: '#ef4444', background: '#ef444415', border: '1px solid #ef444430' }}
          >
            {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
          </button>
        )}
      </div>
    </div>
  )
}