// ══════════════════════════════════════════════════════════════════
// SettingsPage.jsx
// Trang cài đặt người dùng — /settings
// Match design system của ProfileModal & Header
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useProfileModalStore from '@/store/useProfileModalStore'

// ── Icons ──────────────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Monitor: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

// ── Toggle Switch ──────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 44, height: 24,
        borderRadius: 9999,
        border: 'none',
        background: checked ? 'var(--color-primary)' : 'var(--color-border-default)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: checked ? 23 : 3,
        width: 18, height: 18,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.2s cubic-bezier(0.34,1.2,0.64,1)',
      }} />
    </button>
  )
}

// ── Section wrapper ────────────────────────────────────────────────
function Section({ icon, title, description, children }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border-subtle)',
      background: 'var(--color-bg-elevated)',
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-muted)',
      }}>
        <span style={{ color: 'var(--color-primary)', display: 'flex' }}>{icon}</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{title}</p>
          {description && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{description}</p>
          )}
        </div>
      </div>
      <div style={{ padding: '4px 0' }}>{children}</div>
    </div>
  )
}

// ── Row item ──────────────────────────────────────────────────────
function Row({ label, description, right, onClick, danger, disabled }) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '14px 20px',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        transition: 'background 0.12s ease',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (onClick && !disabled) e.currentTarget.style.background = 'var(--color-bg-muted)'
      }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500, margin: 0,
          color: danger ? '#ef4444' : 'var(--color-text-primary)',
        }}>{label}</p>
        {description && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '3px 0 0', lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '0 20px' }} />
}

// ── Theme selector ────────────────────────────────────────────────
const THEMES = [
  { key: 'light', label: 'Sáng', icon: <Icon.Sun /> },
  { key: 'dark', label: 'Tối', icon: <Icon.Moon /> },
  { key: 'system', label: 'Hệ thống', icon: <Icon.Monitor /> },
]

function ThemeSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {THEMES.map((t) => {
        const active = value === t.key
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
              background: active ? 'var(--color-primary-subtle)' : 'var(--color-bg-muted)',
              color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
              transition: 'all 0.15s ease', flex: 1,
            }}
          >
            {t.icon}
            {t.label}
            {active && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-primary)',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Delete confirm modal ──────────────────────────────────────────
function DeleteConfirmModal({ onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: 'min(400px, calc(100vw - 32px))',
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: '#ef444415',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ef4444',
        }}>
          <Icon.Trash />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
            Xoá tài khoản vĩnh viễn?
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Tất cả dữ liệu của bạn — lịch sử đơn hàng, địa chỉ, thông tin cá nhân — sẽ bị xoá hoàn toàn và không thể khôi phục.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '9px 18px', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border-default)',
              background: 'transparent', color: 'var(--color-text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 18px', borderRadius: 'var(--radius-md)',
              border: 'none', background: '#ef4444', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0110 10" />
              </svg>
            )}
            Xoá tài khoản
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN: SettingsPage
// ══════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { openProfileModal } = useProfileModalStore()

  // ── Giao diện ──
  // Đọc theme từ localStorage (giống useTheme.js của bạn)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')

  // ── Thông báo ──
  const [notifs, setNotifs] = useState({
    orderUpdate: true,     // cập nhật đơn hàng
    promotion: false,      // khuyến mãi & ưu đãi
    review: true,          // nhắc viết đánh giá
  })

  // ── UI state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null) // { text, type: 'ok'|'err' }

  // Đồng bộ theme với DOM (dùng chung logic với useTheme.js)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const showToast = (text, type = 'ok') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      // TODO: gọi userApi.deleteAccount() khi backend có endpoint
      // await userApi.deleteAccount()
      await new Promise((r) => setTimeout(r, 1200)) // placeholder
      await logout()
      navigate('/')
    } catch {
      showToast('Xoá tài khoản thất bại, thử lại sau', 'err')
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleNotifChange = (key, val) => {
    setNotifs((prev) => ({ ...prev, [key]: val }))
    // TODO: gọi userApi.updateNotifPrefs({ [key]: val })
    showToast('Đã lưu cài đặt thông báo')
  }

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-8"
      style={{ minHeight: '100vh' }}
    >
      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 16, padding: '6px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--color-text-muted)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Quay lại
        </button>

        <h1 style={{
          fontSize: 22, fontWeight: 700,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
          margin: 0,
        }}>
          Cài đặt
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Tuỳ chỉnh trải nghiệm của bạn trên Green Juice Hub
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 1. Giao diện ── */}
        <Section icon={<Icon.Monitor />} title="Giao diện" description="Chọn giao diện phù hợp với bạn">
          <div style={{ padding: '16px 20px' }}>
            <ThemeSelector value={theme} onChange={setTheme} />
          </div>
        </Section>

        {/* ── 2. Thông báo ── */}
        <Section icon={<Icon.Bell />} title="Thông báo" description="Quản lý email thông báo bạn nhận được">
          <Row
            label="Cập nhật đơn hàng"
            description="Xác nhận, vận chuyển và giao hàng thành công"
            right={
              <Toggle
                checked={notifs.orderUpdate}
                onChange={(v) => handleNotifChange('orderUpdate', v)}
              />
            }
          />
          <Divider />
          <Row
            label="Khuyến mãi & Ưu đãi"
            description="Mã giảm giá, flash sale và ưu đãi dành riêng cho bạn"
            right={
              <Toggle
                checked={notifs.promotion}
                onChange={(v) => handleNotifChange('promotion', v)}
              />
            }
          />
          <Divider />
          <Row
            label="Nhắc đánh giá sản phẩm"
            description="Nhắc nhở sau khi đơn hàng được giao"
            right={
              <Toggle
                checked={notifs.review}
                onChange={(v) => handleNotifChange('review', v)}
              />
            }
          />
        </Section>

        {/* ── 3. Bảo mật ── */}
        <Section icon={<Icon.Shield />} title="Bảo mật">
          <Row
            label="Thông tin & Mật khẩu"
            description={user?.hasPassword ? 'Tài khoản đã có mật khẩu' : 'Chưa thiết lập mật khẩu'}
            right={<Icon.ChevronRight />}
            onClick={() => {
              openProfileModal('profile')
              // ProfileModal sẽ mở, scroll đến phần mật khẩu nếu cần
            }}
          />
          <Divider />
          <Row
            label="Địa chỉ giao hàng"
            description="Quản lý địa chỉ nhận hàng của bạn"
            right={<Icon.ChevronRight />}
            onClick={() => openProfileModal('address')}
          />
        </Section>

        {/* ── 4. Tài khoản ── */}
        <Section icon={<Icon.User />} title="Tài khoản">
          <Row
            label="Đăng xuất"
            description="Thoát khỏi tài khoản trên thiết bị này"
            right={<Icon.LogOut />}
            onClick={handleLogout}
          />
          <Divider />
          <Row
            label="Xoá tài khoản"
            description="Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu"
            right={
              <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>Nguy hiểm</span>
            }
            onClick={() => setShowDeleteModal(true)}
            danger
          />
        </Section>

        {/* Phiên bản nhỏ ở cuối */}
        <p style={{
          textAlign: 'center', fontSize: 11,
          color: 'var(--color-text-muted)', paddingBottom: 32,
        }}>
          Green Juice Hub · v1.0.0
        </p>
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9998, padding: '10px 18px',
          borderRadius: 'var(--radius-pill)',
          background: toast.type === 'ok' ? '#16a34a' : '#ef4444',
          color: '#fff', fontSize: 13, fontWeight: 500,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', alignItems: 'center', gap: 6,
          animation: 'fadeInUp 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.type === 'ok' && <Icon.Check />}
          {toast.text}
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}