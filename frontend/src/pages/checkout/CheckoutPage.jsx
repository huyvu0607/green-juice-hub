import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useOrderStore from '@/store/useOrderStore'
import useCartStore from '@/store/useCartStore'
import userApi from '@/api/userApi'
import momoLogo from '@/assets/payment-momo.png'
import vnpayLogo from '@/assets/payment-vnpay.png'
import { usePageReady } from '@/hooks/usePageReady'
import BankTransferModal from '@/components/order/BankTransferModal'
import OrderSuccessModal from '@/components/order/OrderSuccessModal'
import orderApi from '@/api/orderApi'
import useProfileModalStore from '@/store/useProfileModalStore'
import paymentApi from '@/api/paymentApi'




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
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Percent: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Cart: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
  Zap: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
      <h2
        className="font-semibold text-base"
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
          letterSpacing: '-0.01em',
        }}
      >
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

// ── Breadcrumb ──────────────────────────────────────────────────────────────
function Breadcrumb({ isBuyNow }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
      <Link to="/" className="transition-colors hover:text-[var(--color-primary)]">Trang chủ</Link>
      <span className="opacity-40">/</span>
      {!isBuyNow && (
        <>
          <Link to="/cart" className="transition-colors hover:text-[var(--color-primary)]">Giỏ hàng</Link>
          <span className="opacity-40">/</span>
        </>
      )}
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Thanh toán</span>
    </nav>
  )
}

// ── Address selector ────────────────────────────────────────────────────────
function AddressSelector({ selectedId, onSelect }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const isProfileModalOpen = useProfileModalStore((s) => s.isOpen)
  const wasOpenRef = useRef(false)

  const fetchAddresses = () => {
    setLoading(true)
    userApi.getAddresses()
      .then((res) => {
        const list = res.data
        setAddresses(list)
        if (!selectedId) {
          const def = list.find((a) => a.isDefault) ?? list[0]
          if (def) onSelect(def.id)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAddresses() }, [])

  useEffect(() => {
    if (wasOpenRef.current && !isProfileModalOpen) fetchAddresses() // vừa đóng modal -> refetch
    wasOpenRef.current = isProfileModalOpen
  }, [isProfileModalOpen])

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
        <button
          onClick={() => useProfileModalStore.getState().openProfileModal('address')}
          className="underline cursor-pointer"
          style={{ color: 'var(--color-primary)', background: 'none', border: 'none', padding: 0 }}
        >
          Thêm ngay
        </button>
      </p>
    )
  }

  return (
    <>
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
// ── Promo Picker Modal ──────────────────────────────────────────────────────
// ── Promo Picker Modal ──────────────────────────────────────────────────────
function PromoPickerModal({ onClose, onSelect, promoPayload, subtotal, currentCode }) {
  const { fetchAvailablePromos, applyPromo } = useOrderStore()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [applying, setApplying] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const list = await fetchAvailablePromos(promoPayload)
        setPromos(list)
      } catch {
        setPromos([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = promos.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const eligible = filtered.filter((p) => p.isEligible)
  const ineligible = filtered.filter((p) => !p.isEligible)
  const sorted = [...eligible, ...ineligible]

  const handleApply = async (code) => {
    setApplying(code)
    try {
      const result = await applyPromo(code, promoPayload)
      onSelect(result)
      onClose()
    } catch {
    } finally {
      setApplying(null)
    }
  }

  const fmtDiscount = (p) => {
    if (p.discountType === 'PERCENT') return `Giảm ${p.discountValue}%`
    if (p.discountType === 'FIXED') return `Giảm ${fmt(p.discountValue)}`
    return ''
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      {/* ── Tăng max-w lên xl (576px), padding rộng hơn ── */}
      <div
        className="w-full max-w-xl rounded-[var(--radius-lg)] overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          maxHeight: '85vh',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <div>
            <p
              className="font-bold text-base"
              style={{
                color: 'var(--color-text-primary)',
                fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Mã khuyến mãi
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {eligible.length} mã khả dụng
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors"
            style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-subtle)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
          >
            <Icon.X />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Tìm mã khuyến mãi..."
            className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-all"
            style={{
              background: 'var(--color-bg-muted)',
              border: '1.5px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-subtle)' }}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3"
          style={{ minHeight: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {search ? 'Không tìm thấy mã phù hợp' : 'Chưa có mã khuyến mãi nào'}
              </p>
            </div>
          ) : (
            sorted.map((promo) => {
              const isActive = currentCode === promo.code
              const isApplying = applying === promo.code

              return (
                <div key={promo.code} className="flex flex-col">
                  {/* ── Stripe top — để ngoài wrapper overflow ── */}
                  <div
                    style={{
                      height: 3,
                      borderRadius: '6px 6px 0 0',
                      background: promo.isEligible
                        ? 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))'
                        : 'var(--color-border-subtle)',
                      flexShrink: 0,
                    }}
                  />

                  {/* ── Card body ── */}
                  <div
                    className="flex items-center gap-4 px-4 py-3 transition-all"
                    style={{
                      border: isActive
                        ? '1.5px solid var(--color-primary)'
                        : '1.5px solid var(--color-border-subtle)',
                      borderTop: 'none',           // stripe đã làm top rồi
                      borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                      opacity: promo.isEligible ? 1 : 0.55,
                      background: isActive
                        ? 'var(--color-primary-subtle)'
                        : promo.isEligible
                          ? 'var(--color-bg-muted)'
                          : 'var(--color-bg-surface)',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center"
                      style={{
                        background: promo.isEligible ? 'var(--color-primary-muted)' : 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-subtle)',
                        color: promo.isEligible ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      }}
                    >
                      <Icon.Percent />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-mono font-bold text-sm tracking-wide"
                          style={{ color: promo.isEligible ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                        >
                          {promo.code}
                        </span>
                        {isActive && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: 'var(--color-primary)', color: '#fff' }}
                          >
                            Đang dùng
                          </span>
                        )}
                        {!promo.isEligible && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: 'var(--color-bg-surface)',
                              color: 'var(--color-text-muted)',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            Không đủ điều kiện
                          </span>
                        )}
                      </div>

                      <p
                        className="text-xs mt-1 font-semibold"
                        style={{ color: promo.isEligible ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                      >
                        {fmtDiscount(promo)}
                        {promo.minOrderValue > 0 && (
                          <span className="font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>
                            · Đơn tối thiểu {fmt(promo.minOrderValue)}
                          </span>
                        )}
                      </p>

                      {promo.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {promo.description}
                        </p>
                      )}

                      {!promo.isEligible && promo.reason && (
                        <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                          ⚠ {promo.reason}
                        </p>
                      )}
                    </div>

                    {/* Button */}
                    <button
                      disabled={!promo.isEligible || isApplying}
                      onClick={() => promo.isEligible && handleApply(promo.code)}
                      className="flex-shrink-0 w-16 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all text-center"
                      style={
                        !promo.isEligible
                          ? { background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', cursor: 'not-allowed', border: '1px solid var(--color-border-subtle)' }
                          : isActive
                            ? { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430', cursor: 'pointer' }
                            : { background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }
                      }
                    >
                      {isApplying ? '...' : isActive ? 'Bỏ' : 'Dùng'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)' }}
        >
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Giá trị đơn hàng hiện tại:{' '}
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{fmt(subtotal)}</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  )
}

// ── Promo input ─────────────────────────────────────────────────────────────
function PromoInput({ promoPayload, onApplied, onCleared, subtotal }) {
  const { applyPromo, clearPromo, promoResult, promoLoading, promoError } = useOrderStore()
  const [code, setCode] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const handleApply = async (codeToApply) => {
    const c = codeToApply ?? code.trim()
    if (!c) return
    try {
      const result = await applyPromo(c, promoPayload)
      onApplied?.(result)
    } catch { }
  }

  const handleClear = () => {
    setCode('')
    clearPromo()
    onCleared?.()
  }

  const handlePickerSelect = (result) => {
    onApplied?.(result)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
              <Icon.Tag />
            </span>
            <input
              value={promoResult ? promoResult.promoCode || code : code}
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
              onClick={() => handleApply()}
              disabled={promoLoading || !code.trim()}
              className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {promoLoading ? '...' : 'Áp dụng'}
            </button>
          )}
        </div>

        {!promoResult && (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors self-start"
            style={{ color: 'var(--color-primary)' }}
          >
            <Icon.ChevronDown />
            Xem tất cả mã khuyến mãi
          </button>
        )}

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

      {showPicker && (
        <PromoPickerModal
          onClose={() => setShowPicker(false)}
          onSelect={handlePickerSelect}
          promoPayload={promoPayload}
          subtotal={subtotal}
          currentCode={promoResult?.promoCode || code}
        />
      )}
    </>
  )
}

// ── Order summary ───────────────────────────────────────────────────────────
function OrderSummary({ items, subtotal, discount, shipping, shippingLoading, total }) {
  return (
    <div className="flex flex-col gap-3">
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
          {shippingLoading ? (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <div className="w-3 h-3 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
              Đang tính...
            </span>
          ) : (
            <span style={{ color: shipping === 0 ? '#16a34a' : 'var(--color-text-primary)' }}>
              {shipping === 0 ? 'Miễn phí' : fmt(shipping)}
            </span>
          )}
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
  const { items: cartItems, fetchCart } = useCartStore()
  const buyNowItem = location.state?.buyNowItem
  const { placeOrder, buyNow, placing, error, clearError, promoResult, clearPromo } = useOrderStore()
  const [successOrder, setSuccessOrder] = useState(null)
  // ── FIX: frozenItems lưu snapshot items + snapshot các giá trị tính tiền ──
  const [frozenItems, setFrozenItems] = useState(null)
  const [frozenPrices, setFrozenPrices] = useState(null)
  // ── Shipping fee từ GHN ──────────────────────────────────────────
  const [shipping, setShipping] = useState(30000)
  const [shippingLoading, setShippingLoading] = useState(false)


  const selectedIds = useMemo(
    () => new Set(location.state?.selectedIds || []),
    [location.state]
  )

  const selectedItems = useMemo(() => {
    if (buyNowItem) return [buyNowItem]
    return cartItems.filter((i) => selectedIds.has(i.cartItemId))
  }, [buyNowItem, cartItems, selectedIds])

  const [addressId, setAddressId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [note, setNote] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [bankTransferOrder, setBankTransferOrder] = useState(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [vnpayLoading, setVnpayLoading] = useState(false)

  // ── Dùng frozenItems nếu đã đặt hàng, tránh mất data khi fetchCart cập nhật ──
  const displayItems = frozenItems ?? selectedItems

  const subtotal = useMemo(() =>
    displayItems.reduce((sum, i) => {
      const price = i.salePrice ?? i.originalPrice
      return sum + price * i.quantity
    }, 0),
    [displayItems]
  )

  const promoPayload = useMemo(() =>
    buyNowItem
      ? { variantId: buyNowItem.variantId, quantity: buyNowItem.quantity }
      : { cartItemIds: [...selectedIds] },
    [buyNowItem, selectedIds]
  )

  // ── Dùng frozenPrices nếu có (sau khi đặt hàng thành công) ──
  const discount = frozenPrices?.discount ?? promoResult?.discountAmount ?? 0
  const displayShipping = frozenPrices?.shipping ?? shipping
  const total = frozenPrices?.total ?? (subtotal - discount + displayShipping)

  useEffect(() => {
    if (!addressId) return

    const fetchShipping = async () => {
      setShippingLoading(true)
      try {
        const payload = buyNowItem
          ? { addressId, variantId: buyNowItem.variantId, quantity: buyNowItem.quantity }
          : { addressId, cartItemIds: [...selectedIds] }

        const res = await orderApi.calculateShippingFee(payload)
        setShipping(res.data.shippingFee)
      } catch {
        setShipping(30000) // fallback
      } finally {
        setShippingLoading(false)
      }
    }

    fetchShipping()
  }, [addressId])

  useEffect(() => {
    if (buyNowItem) return
    if (orderPlaced) return
    if (selectedItems.length === 0 && cartItems.length > 0) {
      navigate('/products')
    }
  }, [selectedItems, cartItems, buyNowItem])

  useEffect(() => () => clearPromo(), [])

  const handlePromoApplied = (result) => {
    setPromoCode(result.promoCode)
    if (result.freeShipping) {
      setShipping(0)
    }
  }


  const handlePromoCleared = () => {
    setPromoCode('')
    // Fetch lại shipping thực tế khi bỏ mã
    if (addressId) {
      const refetchShipping = async () => {
        setShippingLoading(true)
        try {
          const payload = buyNowItem
            ? { addressId, variantId: buyNowItem.variantId, quantity: buyNowItem.quantity }
            : { addressId, cartItemIds: [...selectedIds] }
          const res = await orderApi.calculateShippingFee(payload)
          setShipping(res.data.shippingFee)
        } catch {
          setShipping(30000)
        } finally {
          setShippingLoading(false)
        }
      }
      refetchShipping()
    }
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

    // ── Snapshot toàn bộ items + giá trước khi gọi API ──
    const snapshotItems = [...selectedItems]
    const snapshotDiscount = promoResult?.discountAmount ?? 0
    const snapshotSubtotal = snapshotItems.reduce((sum, i) => {
      const price = i.salePrice ?? i.originalPrice
      return sum + price * i.quantity
    }, 0)
    const snapshotShipping = shipping
    const snapshotTotal = snapshotSubtotal - snapshotDiscount + snapshotShipping

    setFrozenItems(snapshotItems)
    setFrozenPrices({
      discount: snapshotDiscount,
      shipping: snapshotShipping,
      total: snapshotTotal,
    })

    try {
      let order
      if (buyNowItem) {
        order = await buyNow({
          variantId: buyNowItem.variantId,
          quantity: buyNowItem.quantity,
          addressId,
          paymentMethod,
          promoCode: promoCode || undefined,
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

      if (!buyNowItem) {
        setOrderPlaced(true)
        await fetchCart()
      }
      if (paymentMethod === 'BANK_TRANSFER') {
        setBankTransferOrder(order)
      } else if (paymentMethod === 'VNPAY') {
        setVnpayLoading(true)
        try {
          const res = await paymentApi.createVnpayUrl(order.id)
          window.location.href = res.data.paymentUrl
        } catch {
          setVnpayLoading(false)
          setSuccessOrder(order) // fallback nếu lỗi tạo URL
        }
      } else {
        setSuccessOrder(order)
      }
    } catch {
      // Nếu lỗi thì xoá frozen để UI về trạng thái bình thường
      setFrozenItems(null)
      setFrozenPrices(null)
    }
  }

  return (
    <>
      {bankTransferOrder && (
        <BankTransferModal
          order={bankTransferOrder}
          onClose={() => navigate('/orders/' + bankTransferOrder.id, { state: { fromCheckout: true } })}
        />
      )}
      {successOrder && (
        <OrderSuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} />
      )}

      <div className="min-h-screen py-8 px-4" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <Breadcrumb isBuyNow={!!buyNowItem} />

          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-[var(--radius-md)] cursor-pointer transition-colors"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
            >
              <Icon.ArrowLeft />
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--color-text-primary)', fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif' }}>
                Thanh toán
              </h1>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {displayItems.length} sản phẩm
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] text-sm flex items-center justify-between"
              style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}>
              <span>{error}</span>
              <button onClick={clearError} className="cursor-pointer"><Icon.X /></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Cột trái */}
            <div className="flex flex-col gap-5">
              <Card>
                <SectionTitle icon={<Icon.MapPin />} title="Địa chỉ giao hàng" />
                <AddressSelector selectedId={addressId} onSelect={setAddressId} />
              </Card>

              <Card>
                <SectionTitle icon={<Icon.Wallet />} title="Phương thức thanh toán" />
                <div className="flex flex-col gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label key={method.id}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] cursor-pointer transition-all"
                      style={{
                        border: paymentMethod === method.id ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border-subtle)',
                        background: paymentMethod === method.id ? 'var(--color-primary-subtle)' : 'var(--color-bg-muted)',
                      }}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: paymentMethod === method.id ? 'var(--color-primary)' : 'var(--color-border-default)' }}>
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
                        )}
                      </div>
                      {method.logo}
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{method.label}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionTitle icon={<Icon.Tag />} title="Mã khuyến mãi" />
                <PromoInput promoPayload={promoPayload} onApplied={handlePromoApplied}
                  onCleared={handlePromoCleared} subtotal={subtotal} />
              </Card>

              <Card>
                <SectionTitle icon={<Icon.Truck />} title="Ghi chú đơn hàng" />
                <textarea value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú cho người giao hàng (tuỳ chọn)..." rows={3}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-all resize-none"
                  style={{ background: 'var(--color-bg-muted)', border: '1.5px solid var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-subtle)' }}
                />
              </Card>
            </div>

            {/* Cột phải */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
              <Card>
                <SectionTitle icon="🛒" title="Đơn hàng của bạn" />
                <OrderSummary
                  items={displayItems}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={displayShipping}
                  shippingLoading={shippingLoading}
                  total={total}
                />
              </Card>

              <button onClick={handleSubmit}
                disabled={placing || vnpayLoading || !addressId || displayItems.length === 0 || shippingLoading}
                className="w-full py-3.5 rounded-[var(--radius-md)] font-semibold text-sm text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--color-primary)' }}
                onMouseEnter={(e) => { if (!placing) e.currentTarget.style.background = 'var(--color-primary-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)' }}
              >
                {placing || vnpayLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {vnpayLoading ? 'Đang chuyển đến VNPay...' : 'Đang xử lý...'}
                  </>
                ) : (
                  <>Đặt hàng · {fmt(total)}<Icon.ChevronRight /></>
                )}
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Bằng cách đặt hàng, bạn đồng ý với{' '}
                <a href="/policies/terms" className="underline" style={{ color: 'var(--color-primary)' }}>điều khoản sử dụng</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}