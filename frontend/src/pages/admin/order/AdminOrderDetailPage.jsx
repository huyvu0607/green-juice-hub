import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import adminOrderApi from '@/api/adminOrderApi'

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

const formatDate = (iso) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

const STATUS_CFG = {
  PENDING: { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  SHIPPING: { label: 'Đang giao', color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6' },
  DELIVERED: { label: 'Đã giao', color: '#14532d', bg: '#dcfce7', dot: '#16a34a' },
  CANCELLED: { label: 'Đã huỷ', color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
}

const PAYMENT_STATUS_CFG = {
  PENDING: { label: 'Chưa thanh toán', color: '#92400e', bg: '#fef3c7' },
  PAID: { label: 'Đã thanh toán', color: '#14532d', bg: '#dcfce7' },
  REFUNDED: { label: 'Đã hoàn tiền', color: '#5b21b6', bg: '#ede9fe' },
}

const PAYMENT_METHOD_LABEL = {
  COD: 'Tiền mặt khi nhận hàng (COD)',
  VNPAY: 'VNPay',
  MOMO: 'Ví MoMo',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

// Các chuyển trạng thái hợp lệ — dùng để render nút action
const NEXT_STATUS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

const NEXT_STATUS_CFG = {
  CONFIRMED: { label: 'Xác nhận đơn', color: '#1e40af', bg: '#dbeafe', hoverBg: '#bfdbfe' },
  SHIPPING: { label: 'Bắt đầu giao', color: '#5b21b6', bg: '#ede9fe', hoverBg: '#ddd6fe' },
  CANCELLED: { label: 'Huỷ đơn', color: '#991b1b', bg: '#fee2e2', hoverBg: '#fecaca' },
}

// ── Components ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {title && (
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
        </div>
      )}
      {children}
    </div>
  )
}

// ── Status Stepper ────────────────────────────────────────────────
const STEPS = [
  { key: 'PENDING', label: 'Đặt hàng' },
  { key: 'CONFIRMED', label: 'Xác nhận' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Hoàn tất' },
]

function OrderStepper({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
        style={{ background: '#fee2e2', color: '#991b1b' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span className="font-semibold">Đơn hàng đã bị huỷ</span>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex(s => s.key === status)

  return (
    <div className="flex items-start w-full">
      {STEPS.map((step, idx) => {
        const done = idx <= currentIdx
        const active = idx === currentIdx
        const isLast = idx === STEPS.length - 1
        return (
          <div key={step.key} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div
                className="flex-1 h-0.5"
                style={{ background: idx === 0 ? 'transparent' : done ? '#16a34a' : '#e5e7eb' }}
              />
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: done ? '#16a34a' : '#f3f4f6',
                  border: active ? '2.5px solid #16a34a' : done ? 'none' : '1.5px solid #e5e7eb',
                  boxShadow: active ? '0 0 0 3px #dcfce7' : 'none',
                }}
              >
                {done && !active && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
                {!done && !active && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
              </div>
              <div
                className="flex-1 h-0.5"
                style={{ background: isLast ? 'transparent' : idx < currentIdx ? '#16a34a' : '#e5e7eb' }}
              />
            </div>
            <p
              className="text-xs mt-2 text-center"
              style={{
                color: done ? '#15803d' : '#9ca3af',
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

// ── Cancel Reason Modal ───────────────────────────────────────────
const CANCEL_REASONS_ADMIN = [
  'Khách hàng yêu cầu huỷ',
  'Sản phẩm hết hàng',
  'Địa chỉ giao hàng không hợp lệ',
  'Không liên lạc được với khách',
  'Đơn hàng trùng lặp',
  'Lý do khác',
]

function CancelReasonModal({ onConfirm, onClose, loading }) {
  const [selected, setSelected] = useState(null)
  const [custom, setCustom] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isOther = selected === 'Lý do khác'
  const reason = isOther ? custom.trim() : selected
  const canSubmit = selected && (!isOther || custom.trim().length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: '#fef2f2' }}>
          <p className="text-sm font-semibold text-red-700">Xác nhận huỷ đơn hàng</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 cursor-pointer hover:bg-red-200">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-1.5">
          <p className="text-xs text-gray-500 mb-2">Chọn lý do huỷ:</p>
          {CANCEL_REASONS_ADMIN.map((r) => (
            <button
              key={r}
              onClick={() => { setSelected(r); setCustom('') }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm cursor-pointer transition-all"
              style={{
                border: selected === r ? '1.5px solid #ef4444' : '1px solid #f3f4f6',
                background: selected === r ? '#fef2f2' : 'transparent',
                color: selected === r ? '#dc2626' : '#374151',
              }}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  border: selected === r ? '2px solid #ef4444' : '1.5px solid #e5e7eb',
                  background: selected === r ? '#ef4444' : 'transparent',
                }}
              >
                {selected === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {r}
            </button>
          ))}

          {isOther && (
            <textarea
              autoFocus
              rows={3}
              placeholder="Nhập lý do huỷ..."
              value={custom}
              onChange={e => setCustom(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 resize-none outline-none focus:border-red-400 bg-gray-50 text-gray-900"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
          >
            Giữ lại
          </button>
          <button
            onClick={() => canSubmit && !loading && onConfirm(reason)}
            disabled={!canSubmit || loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-40 transition-opacity"
            style={{ background: '#ef4444' }}
          >
            {loading ? 'Đang huỷ...' : 'Xác nhận huỷ'}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(14px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  )
}

// ── Refund Modal ──────────────────────────────────────────────────
function RefundModal({ order, onConfirm, onClose, loading }) {
  const [note, setNote] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: '#f5f3ff' }}>
          <p className="text-sm font-semibold text-purple-700">Xác nhận hoàn tiền</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 cursor-pointer hover:bg-purple-200">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between items-center px-4 py-3 rounded-lg" style={{ background: '#f5f3ff' }}>
            <span className="text-sm text-purple-700">Số tiền hoàn</span>
            <span className="text-base font-bold text-purple-700">{fmt(order.totalAmount)}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú hoàn tiền (tuỳ chọn)</label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Lý do hoàn tiền, hướng dẫn cho kế toán..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 resize-none outline-none focus:border-purple-400 bg-gray-50 text-gray-900"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">
            Huỷ bỏ
          </button>
          <button
            onClick={() => !loading && onConfirm(note)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-40"
            style={{ background: '#7c3aed' }}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(14px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  const colors = {
    success: { bg: '#dcfce7', color: '#14532d', border: '#bbf7d0' },
    error: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  }
  const c = colors[type] || colors.success

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, animation: 'slideUp 0.2s ease' }}
    >
      {type === 'success'
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
      }
      {message}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => setToast({ message, type })

  // ── Fetch chi tiết ───────────────────────────────────────────────
  const fetchDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminOrderApi.getOrderDetail(orderId)
      setOrder(res.data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Không thể tải chi tiết đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetail() }, [orderId])

  // ── Cập nhật trạng thái ──────────────────────────────────────────
  const handleUpdateStatus = async (newStatus, cancelReason = null) => {
    setActionLoading(true)
    try {
      const res = await adminOrderApi.updateStatus(orderId, newStatus, cancelReason)
      setOrder(res.data)
      showToast(`Đã chuyển sang "${STATUS_CFG[newStatus]?.label || newStatus}"`)
    } catch (e) {
      showToast(e?.response?.data?.message || 'Cập nhật thất bại', 'error')
    } finally {
      setActionLoading(false)
      setShowCancelModal(false)
    }
  }

  // ── Hoàn tiền ────────────────────────────────────────────────────
  const handleRefund = async (note) => {
    setActionLoading(true)
    try {
      const res = await adminOrderApi.refund(orderId, note)
      setOrder(res.data)
      showToast('Đã xử lý hoàn tiền thành công')
    } catch (e) {
      showToast(e?.response?.data?.message || 'Hoàn tiền thất bại', 'error')
    } finally {
      setActionLoading(false)
      setShowRefundModal(false)
    }
  }

  // ── Loading / Error ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm text-red-600">{error || 'Không tìm thấy đơn hàng'}</p>
        <button onClick={() => navigate('/admin/orders')} className="text-sm text-green-600 underline cursor-pointer">
          Quay lại danh sách
        </button>
      </div>
    )
  }

  const addr = order.shippingAddress
  const paymentCfg = PAYMENT_STATUS_CFG[order.paymentStatus] || {}
  const nextStatuses = NEXT_STATUS[order.status] || []
  const canRefund = order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUND_PENDING'

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">

      {/* ── Breadcrumb + header ── */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Đơn hàng{' '}
              <span className="font-mono text-green-700">#{order.orderCode}</span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Đặt lúc {formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Cột trái (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Stepper */}
          <SectionCard title="Tiến trình đơn hàng">
            <div className="px-5 py-5">
              <OrderStepper status={order.status} />
              {order.status === 'CANCELLED' && order.cancelReason && (
                <div
                  className="mt-4 px-3 py-2.5 rounded-lg text-xs"
                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                >
                  <span className="font-medium">Lý do huỷ:</span> {order.cancelReason}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Sản phẩm */}
          <SectionCard title={`Sản phẩm (${order.items?.length ?? 0})`}>
            <div className="divide-y divide-gray-50">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                  <img
                    src={item.imageUrl || '/placeholder.png'}
                    alt={item.productName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmt(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {fmt(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Địa chỉ giao hàng */}
          <SectionCard title="Địa chỉ giao hàng">
            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">{addr?.fullName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{addr?.phone}</p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {addr?.detail}, {addr?.ward}, {addr?.district}, {addr?.province}
              </p>
              {order.note && (
                <p className="text-xs text-gray-400 mt-2 italic">Ghi chú: {order.note}</p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Cột phải (1/3) ── */}
        <div className="space-y-5">

          {/* Tóm tắt tài chính */}
          <SectionCard title="Tóm tắt đơn hàng">
            <div className="px-5 py-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span className="text-gray-800">{fmt(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Giảm giá
                    {order.promoCode && <span className="font-mono text-xs ml-1">({order.promoCode})</span>}
                  </span>
                  <span className="text-green-700">-{fmt(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className={order.shippingFee === 0 ? 'text-green-700' : 'text-gray-800'}>
                  {order.shippingFee === 0 ? 'Miễn phí' : fmt(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2.5 font-semibold text-base border-t border-gray-100">
                <span>Tổng cộng</span>
                <span className="text-green-700">{fmt(order.totalAmount)}</span>
              </div>
            </div>
          </SectionCard>

          {/* Thanh toán */}
          <SectionCard title="Thanh toán">
            <div className="px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Phương thức</span>
                <span className="text-xs font-medium text-gray-700">
                  {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Trạng thái</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: paymentCfg.bg, color: paymentCfg.color }}
                >
                  {paymentCfg.label}
                </span>
              </div>

              {/* Nút hoàn tiền */}
              {canRefund && order.paymentStatus !== 'REFUNDED' && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  disabled={actionLoading}
                  className="w-full mt-2 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                  style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f5f3ff'}
                >
                  {order.paymentStatus === 'REFUND_PENDING'
                    ? '✓ Xác nhận đã chuyển tiền'
                    : 'Xử lý hoàn tiền'}
                </button>
              )}
            </div>
          </SectionCard>

          {/* Action buttons — cập nhật trạng thái */}
          {nextStatuses.length > 0 && (
            <SectionCard title="Cập nhật trạng thái">
              <div className="px-5 py-4 space-y-2">
                {nextStatuses.map((ns) => {
                  const cfg = NEXT_STATUS_CFG[ns]
                  if (!cfg) return null
                  const isCancelBtn = ns === 'CANCELLED'
                  return (
                    <button
                      key={ns}
                      onClick={() => {
                        if (isCancelBtn) { setShowCancelModal(true) }
                        else { handleUpdateStatus(ns) }
                      }}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 active:scale-[0.98]"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.hoverBg}` }}
                      onMouseEnter={e => e.currentTarget.style.background = cfg.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = cfg.bg}
                    >
                      {actionLoading ? 'Đang xử lý...' : cfg.label}
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showCancelModal && (
        <CancelReasonModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => handleUpdateStatus('CANCELLED', reason)}
          loading={actionLoading}
        />
      )}

      {showRefundModal && (
        <RefundModal
          order={order}
          onClose={() => setShowRefundModal(false)}
          onConfirm={handleRefund}
          loading={actionLoading}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}