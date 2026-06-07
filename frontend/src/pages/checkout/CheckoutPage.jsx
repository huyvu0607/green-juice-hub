import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useOrderStore from '@/store/useOrderStore'
import useCartStore from '@/store/useCartStore'
import userApi from '@/api/userApi'
import momoLogo from '@/assets/payment-momo.png'
import vnpayLogo from '@/assets/payment-vnpay.png'
import { usePageReady } from '@/hooks/usePageReady'
import BankTransferModal from '@/components/order/BankTransferModal'


// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Tag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  Wallet: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 3H8L6 7h12l-2-4z" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
}

// ── Payment methods ─────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'COD',
    label: 'Thanh toán khi nhận hàng',
    desc: 'Trả tiền mặt khi nhận hàng',
    logo: (
      <div className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center text-xl"
        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        💵
      </div>
    ),
  },
  {
    id: 'VNPAY',
    label: 'VNPay',
    desc: 'Thanh toán qua cổng VNPay',
    logo: <img src={vnpayLogo} alt="VNPay" className="w-10 h-10 object-contain rounded-[var(--radius-sm)]" />,
  },
  {
    id: 'MOMO',
    label: 'MoMo',
    desc: 'Thanh toán qua ví MoMo',
    logo: <img src={momoLogo} alt="MoMo" className="w-10 h-10 object-contain rounded-[var(--radius-sm)]" />,
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Chuyển khoản ngân hàng',
    desc: 'Chuyển khoản trực tiếp',
    logo: (
      <div className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center text-xl"
        style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        🏦
      </div>
    ),
  },
]

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
        {title}
      </h2>
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] p-5 ${className}`}
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {children}
    </div>
  )
}

// ── Address selector ────────────────────────────────────────────────────────
function AddressSelector({ selectedId, onSelect }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    userApi.getAddresses()
      .then((res) => {
        const list = res.data
        setAddresses(list)
        // Tự chọn mặc định
        if (!selectedId) {
          const def = list.find((a) => a.isDefault) ?? list[0]
          if (def) onSelect(def.id)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const selected = addresses.find((a) => a.id === selectedId)

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
        Bạn chưa có địa chỉ nào.{' '}
        <a href="/profile" className="underline" style={{ color: 'var(--color-primary)' }}>Thêm ngay</a>
      </p>
    )
  }

  return (
    <>
      {/* Hiện địa chỉ đang chọn */}
      {selected && (
        <div
          className="flex items-start justify-between gap-3 p-3 rounded-[var(--radius-md)]"
          style={{ background: 'var(--color-primary-subtle)', border: '1.5px solid var(--color-primary)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {selected.fullName}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selected.phone}</span>
              {selected.isDefault && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                >
                  Mặc định
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {selected.detail}, {selected.ward}, {selected.district}, {selected.province}
            </p>
          </div>
          {addresses.length > 1 && (
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs font-medium flex-shrink-0 px-2.5 py-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
              style={{ color: 'var(--color-primary)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-primary)' }}
            >
              Đổi
            </button>
          )}
        </div>
      )}

      {/* Modal chọn địa chỉ */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-lg)] p-5 flex flex-col gap-3 max-h-[80vh] overflow-y-auto"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Chọn địa chỉ giao hàng</p>
              <button onClick={() => setShowPicker(false)} style={{ color: 'var(--color-text-muted)' }}>
                <Icon.X />
              </button>
            </div>
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className="flex items-start gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] transition-all"
                style={{
                  border: selectedId === addr.id ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border-subtle)',
                  background: selectedId === addr.id ? 'var(--color-primary-subtle)' : 'var(--color-bg-muted)',
                }}
                onClick={() => { onSelect(addr.id); setShowPicker(false) }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ borderColor: selectedId === addr.id ? 'var(--color-primary)' : 'var(--color-border-default)' }}
                >
                  {selectedId === addr.id && (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{addr.fullName}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ── Promo input ─────────────────────────────────────────────────────────────
function PromoInput({ cartItemIds, onApplied, onCleared }) {
  const { applyPromo, clearPromo, promoResult, promoLoading, promoError } = useOrderStore()
  const [code, setCode] = useState('')

  const handleApply = async () => {
    if (!code.trim()) return
    try {
      const result = await applyPromo(code.trim(), cartItemIds)
      onApplied?.(result)
    } catch { }
  }

  const handleClear = () => {
    setCode('')
    clearPromo()
    onCleared?.()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
            <Icon.Tag />
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            disabled={!!promoResult}
            placeholder="Nhập mã khuyến mãi"
            className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-all"
            style={{
              background: 'var(--color-bg-muted)',
              border: '1.5px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-subtle)' }}
          />
        </div>

        {promoResult ? (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium flex items-center gap-1 cursor-pointer"
            style={{ background: '#ef444415', color: '#ef4444', border: '1.5px solid #ef444430' }}
          >
            <Icon.X /> Bỏ
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={promoLoading || !code.trim()}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {promoLoading ? '...' : 'Áp dụng'}
          </button>
        )}
      </div>

      {promoError && (
        <p className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)]" style={{ background: '#ef444415', color: '#ef4444' }}>
          {promoError}
        </p>
      )}

      {promoResult && (
        <p className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)]" style={{ background: '#16a34a15', color: '#16a34a' }}>
          🎉 {promoResult.message}
        </p>
      )}
    </div>
  )
}

// ── Order summary ───────────────────────────────────────────────────────────
function OrderSummary({ items, subtotal, discount, shipping, total }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Item list */}
      <div className="flex flex-col gap-2 pb-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        {items.map((item) => {
          const price = item.salePrice ?? item.originalPrice
          return (
            <div key={item.cartItemId} className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={item.imageUrl || '/placeholder.png'}
                  alt={item.productName}
                  className="w-12 h-12 rounded-[var(--radius-sm)] object-cover"
                  style={{ border: '1px solid var(--color-border-subtle)' }}
                />
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {item.productName}
                </p>
                {item.variantLabel && (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.variantLabel}</p>
                )}
              </div>
              <p className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                {fmt(price * item.quantity)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Tổng tiền */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-secondary)' }}>Tạm tính</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{fmt(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>Giảm giá</span>
            <span style={{ color: '#16a34a' }}>-{fmt(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-secondary)' }}>Phí vận chuyển</span>
          <span style={{ color: shipping === 0 ? '#16a34a' : 'var(--color-text-primary)' }}>
            {shipping === 0 ? 'Miễn phí' : fmt(shipping)}
          </span>
        </div>
        <div
          className="flex justify-between pt-2 font-semibold text-base"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <span style={{ color: 'var(--color-text-primary)' }}>Tổng cộng</span>
          <span style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { items: cartItems } = useCartStore()
  const buyNowItem = location.state?.buyNowItem
  const { placeOrder, buyNow, placing, error, clearError, promoResult, clearPromo } = useOrderStore()
  usePageReady(false)

  // Lấy danh sách cartItemId từ navigate state (truyền từ CartSidebar)
  const selectedIds = useMemo(
    () => new Set(location.state?.selectedIds || []),
    [location.state]
  )

  // Items đã chọn
  const selectedItems = useMemo(() => {
    if (buyNowItem) return [buyNowItem]
    return cartItems.filter((i) => selectedIds.has(i.cartItemId))
  }, [buyNowItem, cartItems, selectedIds])

  const [addressId, setAddressId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [note, setNote] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [bankTransferOrder, setBankTransferOrder] = useState(null)

  // Tính tiền
  const subtotal = useMemo(() =>
    selectedItems.reduce((sum, i) => {
      const price = i.salePrice ?? i.originalPrice
      return sum + price * i.quantity
    }, 0),
    [selectedItems]
  )

  const discount = promoResult?.discountAmount ?? 0
  const shipping = subtotal - discount >= 200000 ? 0 : 30000
  const total = subtotal - discount + shipping

  // Nếu không có item nào → về trang chủ
  useEffect(() => {
    if (buyNowItem) return                                    // ← thêm
    if (selectedItems.length === 0 && cartItems.length > 0) {
      navigate('/products')
    }
  }, [selectedItems, cartItems, buyNowItem])   // ← thêm buyNowItem vào dependency

  // Clear promo khi unmount
  useEffect(() => () => clearPromo(), [])

  const handlePromoApplied = (result) => {
    setPromoCode(result.promoCode)
  }

  const handlePromoCleared = () => {
    setPromoCode('')
  }

  const handleSubmit = async () => {
    if (!addressId) {
      alert('Vui lòng chọn địa chỉ giao hàng')
      return
    }
    if (selectedItems.length === 0) {
      alert('Không có sản phẩm nào được chọn')
      return
    }

    try {
      let order
      if (buyNowItem) {
        order = await buyNow({
          variantId: buyNowItem.variantId,
          quantity: buyNowItem.quantity,
          addressId,
          paymentMethod,
          note: note.trim() || undefined,
        })
      } else {
        order = await placeOrder({
          cartItemIds: [...selectedIds],
          addressId,
          paymentMethod,
          promoCode: promoCode || undefined,
          note: note.trim() || undefined,
        })
      }


      if (paymentMethod === 'BANK_TRANSFER') {
        setBankTransferOrder(order)
      } else {
        navigate('/orders/' + order.id, { state: { fromCheckout: true } })
      }
    } catch {
      // Lỗi đã được xử lý trong store, chỉ cần hiện alert nếu muốn
      // alert('Đặt hàng thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <>
      {/* Bank Transfer Modal */}
      {bankTransferOrder && (
        <BankTransferModal
          order={bankTransferOrder}
          onClose={() => navigate('/orders/' + bankTransferOrder.id, { state: { fromCheckout: true } })}
        />
      )}
      <div
        className="min-h-screen py-8 px-4"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-[var(--radius-md)] cursor-pointer transition-colors"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
            >
              <Icon.ArrowLeft />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                Thanh toán
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {selectedItems.length} sản phẩm
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-[var(--radius-md)] text-sm flex items-center justify-between"
              style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
            >
              <span>{error}</span>
              <button onClick={clearError} className="cursor-pointer"><Icon.X /></button>
            </div>
          )}

          {/* Layout 2 cột */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* ── Cột trái ── */}
            <div className="flex flex-col gap-5">

              {/* 1. Địa chỉ giao hàng */}
              <Card>
                <SectionTitle icon={<Icon.MapPin />} title="Địa chỉ giao hàng" />
                <AddressSelector selectedId={addressId} onSelect={setAddressId} />
              </Card>

              {/* 2. Phương thức thanh toán */}
              <Card>
                <SectionTitle icon={<Icon.Wallet />} title="Phương thức thanh toán" />
                <div className="flex flex-col gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] cursor-pointer transition-all"
                      style={{
                        border: paymentMethod === method.id
                          ? '1.5px solid var(--color-primary)'
                          : '1.5px solid var(--color-border-subtle)',
                        background: paymentMethod === method.id
                          ? 'var(--color-primary-subtle)'
                          : 'var(--color-bg-muted)',
                      }}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: paymentMethod === method.id ? 'var(--color-primary)' : 'var(--color-border-default)' }}
                      >
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
                        )}
                      </div>

                      {/* Logo thay cho emoji */}
                      {method.logo}

                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{method.label}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              {/* 3. Mã khuyến mãi */}
              {!buyNowItem && (
                <Card>
                  <SectionTitle icon={<Icon.Tag />} title="Mã khuyến mãi" />
                  <PromoInput
                    cartItemIds={[...selectedIds]}
                    onApplied={handlePromoApplied}
                    onCleared={handlePromoCleared}
                  />
                </Card>
              )}

              {/* 4. Ghi chú */}
              <Card>
                <SectionTitle icon={<Icon.Truck />} title="Ghi chú đơn hàng" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú cho người giao hàng (tuỳ chọn)..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-all resize-none"
                  style={{
                    background: 'var(--color-bg-muted)',
                    border: '1.5px solid var(--color-border-subtle)',
                    color: 'var(--color-text-primary)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-subtle)' }}
                />
              </Card>
            </div>

            {/* ── Cột phải: tóm tắt đơn ── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
              <Card>
                <SectionTitle icon="🛒" title="Đơn hàng của bạn" />
                <OrderSummary
                  items={selectedItems}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                />
              </Card>

              {/* Nút đặt hàng */}
              <button
                onClick={handleSubmit}
                disabled={placing || !addressId || selectedItems.length === 0}
                className="w-full py-3.5 rounded-[var(--radius-md)] font-semibold text-sm text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--color-primary)' }}
                onMouseEnter={(e) => { if (!placing) e.currentTarget.style.background = 'var(--color-primary-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)' }}
              >
                {placing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đặt hàng · {fmt(total)}
                    <Icon.ChevronRight />
                  </>
                )}
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Bằng cách đặt hàng, bạn đồng ý với{' '}
                <a href="/policies/terms" className="underline" style={{ color: 'var(--color-primary)' }}>
                  điều khoản sử dụng
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}