import { useState, useEffect, useRef } from 'react'
import userApi from '@/api/userApi'
import useAuthStore from '@/store/authStore'

// ── Icons (inline SVG để không cần thêm thư viện) ──────────────────────────
const Icon = {
    X: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    User: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    ),
    MapPin: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
        </svg>
    ),
    Lock: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    ),
    Eye: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
    EyeOff: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ),
    Plus: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Edit: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    Trash: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
    ),
    Star: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    Check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    ChevronDown: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
}

// ── Helpers ────────────────────────────────────────────────────────────────
const getInitials = (name) =>
    name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?'

// ── Sub-components ─────────────────────────────────────────────────────────

/** Input có label + error */
function Field({ label, error, children }) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {label}
                </label>
            )}
            {children}
            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
        </div>
    )
}

/** Input cơ bản */
function Input({ type = 'text', suffix, ...props }) {
    return (
        <div className="relative">
            <input
                type={type}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-all"
                style={{
                    background: 'var(--color-bg-muted)',
                    border: '1.5px solid var(--color-border-subtle)',
                    color: 'var(--color-text-primary)',
                    paddingRight: suffix ? '2.5rem' : undefined,
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)'
                    e.target.style.boxShadow = 'var(--shadow-glow)'
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border-subtle)'
                    e.target.style.boxShadow = 'none'
                }}
                {...props}
            />
            {suffix && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                    {suffix}
                </div>
            )}
        </div>
    )
}

/** Password input với toggle */
function PasswordInput(props) {
    const [show, setShow] = useState(false)
    return (
        <Input
            {...props}
            type={show ? 'text' : 'password'}
            suffix={
                <button type="button" onClick={() => setShow(!show)} className="cursor-pointer">
                    {show ? <Icon.EyeOff /> : <Icon.Eye />}
                </button>
            }
        />
    )
}

/** Nút chính */
function Btn({ children, variant = 'primary', loading, small, ...props }) {
    const base = `inline-flex items-center justify-center gap-1.5 font-medium rounded-[var(--radius-md)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`
    const size = small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
    const styles = {
        primary: {
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: '1.5px solid var(--color-border-default)',
        },
        danger: {
            background: 'transparent',
            color: '#ef4444',
            border: '1.5px solid #ef444440',
        },
    }
    return (
        <button
            className={`${base} ${size}`}
            style={styles[variant]}
            disabled={loading || props.disabled}
            onMouseEnter={(e) => {
                if (variant === 'primary') e.currentTarget.style.background = 'var(--color-primary-hover)'
                if (variant === 'ghost') e.currentTarget.style.borderColor = 'var(--color-border-strong)'
                if (variant === 'danger') e.currentTarget.style.background = '#ef444415'
            }}
            onMouseLeave={(e) => {
                if (variant === 'primary') e.currentTarget.style.background = 'var(--color-primary)'
                if (variant === 'ghost') e.currentTarget.style.borderColor = 'var(--color-border-default)'
                if (variant === 'danger') e.currentTarget.style.background = 'transparent'
            }}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" />
                </svg>
            ) : null}
            {children}
        </button>
    )
}

// ══════════════════════════════════════════════════════════════════
// TAB 1: Thông tin cá nhân
// ══════════════════════════════════════════════════════════════════
function ProfileTab({ user, onUserUpdate }) {
    const { setUser } = useAuthStore()

    // ── Profile form ──
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        username: user?.username || '',
    })
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileMsg, setProfileMsg] = useState(null) // { type: 'ok'|'err', text }

    // ── Password form ──
    const [showPwForm, setShowPwForm] = useState(false)
    const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [pwLoading, setPwLoading] = useState(false)
    const [pwMsg, setPwMsg] = useState(null)
    const [pwErrors, setPwErrors] = useState({})

    const hasPassword = user?.hasPassword

    useEffect(() => {
        setProfile({
            name: user?.name || '',
            email: user?.email || '',
            username: user?.username || '',
        })
    }, [user])

    // Validate form đổi mật khẩu phía client
    const validatePw = () => {
        const errs = {}
        if (hasPassword && !pw.currentPassword) errs.currentPassword = 'Nhập mật khẩu hiện tại'
        if (!pw.newPassword) errs.newPassword = 'Nhập mật khẩu mới'
        else if (pw.newPassword.length < 6) errs.newPassword = 'Tối thiểu 6 ký tự'
        if (!pw.confirmPassword) errs.confirmPassword = 'Nhập lại mật khẩu mới'
        else if (pw.newPassword !== pw.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp'
        return errs
    }

    const handleSaveProfile = async () => {
        setProfileLoading(true)
        setProfileMsg(null)
        try {
            const res = await userApi.updateProfile({
                name: profile.name || undefined,
                email: profile.email || undefined,
                username: profile.username || undefined,
            })
            setUser(res.data)
            onUserUpdate?.(res.data)
            setProfileMsg({ type: 'ok', text: 'Đã lưu thông tin' })
        } catch (err) {
            const msg = err?.response?.data?.message || 'Lưu thất bại, thử lại sau'
            setProfileMsg({ type: 'err', text: msg })
        } finally {
            setProfileLoading(false)
        }
    }

    const handleChangePassword = async () => {
        const errs = validatePw()
        if (Object.keys(errs).length > 0) { setPwErrors(errs); return }
        setPwErrors({})
        setPwLoading(true)
        setPwMsg(null)
        try {
            // ← Chỉ gửi currentPassword nếu hasPassword = true
            const payload = hasPassword
                ? { currentPassword: pw.currentPassword, newPassword: pw.newPassword, confirmPassword: pw.confirmPassword }
                : { newPassword: pw.newPassword, confirmPassword: pw.confirmPassword }
            await userApi.changePassword(pw)
            setPwMsg({ type: 'ok', text: hasPassword ? 'Đổi mật khẩu thành công' : 'Đã thiết lập mật khẩu' })
            setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
            // cập nhật hasPassword = true trong store
            onUserUpdate?.({ ...user, hasPassword: true })
            setUser({ ...user, hasPassword: true })
            setShowPwForm(false)
        } catch (err) {
            const msg = err?.response?.data?.message || 'Thất bại, thử lại sau'
            setPwMsg({ type: 'err', text: msg })
        } finally {
            setPwLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 pb-6">

            {/* Avatar + tên */}
            <div className="flex items-center gap-4">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{
                        background: user?.avatarUrl ? 'transparent' : 'var(--color-primary-muted)',
                        color: 'var(--color-primary)',
                    }}
                >
                    {user?.avatarUrl
                        ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                        : getInitials(user?.name || user?.phone)
                    }
                </div>
                <div>
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {user?.name || 'Chưa đặt tên'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {user?.phone || user?.email || '—'}
                    </p>
                    {user?.role && (
                        <span
                            className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
                        >
                            {user.role === 'ADMIN' ? 'Quản trị' : user.role === 'STAFF' ? 'Nhân viên' : 'Khách hàng'}
                        </span>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

            {/* Form thông tin */}
            <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Thông tin cá nhân
                </p>

                <Field label="Họ và tên">
                    <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                    />
                </Field>

                <Field label="Email">
                    <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="example@email.com"
                    />
                </Field>

                <Field label="Tên người dùng">
                    <Input
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        placeholder="username"
                    />
                </Field>

                {profileMsg && (
                    <p className="text-xs px-3 py-2 rounded-[var(--radius-sm)]"
                        style={{
                            background: profileMsg.type === 'ok' ? '#16a34a15' : '#ef444415',
                            color: profileMsg.type === 'ok' ? '#16a34a' : '#ef4444',
                        }}
                    >
                        {profileMsg.text}
                    </p>
                )}

                <Btn onClick={handleSaveProfile} loading={profileLoading}>
                    Lưu thay đổi
                </Btn>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

            {/* Khu vực mật khẩu */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                            Mật khẩu
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                            {hasPassword ? 'Tài khoản đã có mật khẩu' : 'Chưa thiết lập mật khẩu'}
                        </p>
                    </div>
                    <Btn
                        variant="ghost"
                        small
                        onClick={() => { setShowPwForm(!showPwForm); setPwMsg(null); setPwErrors({}) }}
                    >
                        {showPwForm ? 'Huỷ' : hasPassword ? 'Đổi mật khẩu' : 'Thiết lập'}
                    </Btn>
                </div>

                {/* Form mật khẩu (collapse) */}
                {showPwForm && (
                    <div
                        className="flex flex-col gap-3 p-4 rounded-[var(--radius-md)]"
                        style={{ background: 'var(--color-bg-muted)', border: '1.5px solid var(--color-border-subtle)' }}
                    >
                        {/* Chỉ hiện "mật khẩu hiện tại" nếu user đã có password */}
                        {hasPassword && (
                            <Field label="Mật khẩu hiện tại" error={pwErrors.currentPassword}>
                                <PasswordInput
                                    value={pw.currentPassword}
                                    onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </Field>
                        )}

                        <Field label={hasPassword ? 'Mật khẩu mới' : 'Mật khẩu'} error={pwErrors.newPassword}>
                            <PasswordInput
                                value={pw.newPassword}
                                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </Field>

                        <Field label="Xác nhận mật khẩu" error={pwErrors.confirmPassword}>
                            <PasswordInput
                                value={pw.confirmPassword}
                                onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
                                placeholder="Nhập lại mật khẩu"
                            />
                        </Field>

                        {pwMsg && (
                            <p className="text-xs px-3 py-2 rounded-[var(--radius-sm)]"
                                style={{
                                    background: pwMsg.type === 'ok' ? '#16a34a15' : '#ef444415',
                                    color: pwMsg.type === 'ok' ? '#16a34a' : '#ef4444',
                                }}
                            >
                                {pwMsg.text}
                            </p>
                        )}

                        <Btn onClick={handleChangePassword} loading={pwLoading}>
                            {hasPassword ? 'Đổi mật khẩu' : 'Thiết lập mật khẩu'}
                        </Btn>
                    </div>
                )}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: Địa chỉ
// ══════════════════════════════════════════════════════════════════
const EMPTY_ADDR = { fullName: '', phone: '', province: '', district: '', ward: '', detail: '', isDefault: false }

function AddressTab() {
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(null) // null = danh sách | { mode:'create'|'edit', data }
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState({})
    const [msg, setMsg] = useState(null)

    useEffect(() => { fetchAddresses() }, [])

    const fetchAddresses = async () => {
        setLoading(true)
        try {
            const res = await userApi.getAddresses()
            setAddresses(res.data)
        } catch {
            setMsg({ type: 'err', text: 'Không tải được địa chỉ' })
        } finally {
            setLoading(false)
        }
    }

    const validateAddr = (data) => {
        const errs = {}
        if (!data.fullName?.trim()) errs.fullName = 'Nhập họ tên'
        if (!data.phone?.trim()) errs.phone = 'Nhập số điện thoại'
        else if (!/^(0|\+84)[0-9]{8,10}$/.test(data.phone)) errs.phone = 'Số điện thoại không hợp lệ'
        if (!data.province?.trim()) errs.province = 'Nhập tỉnh/thành phố'
        if (!data.district?.trim()) errs.district = 'Nhập quận/huyện'
        if (!data.ward?.trim()) errs.ward = 'Nhập phường/xã'
        if (!data.detail?.trim()) errs.detail = 'Nhập địa chỉ chi tiết'
        return errs
    }

    const handleSave = async () => {
        const errs = validateAddr(form.data)
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setErrors({})
        setSaving(true)
        try {
            if (form.mode === 'create') {
                await userApi.createAddress(form.data)
            } else {
                await userApi.updateAddress(form.data.id, form.data)
            }
            await fetchAddresses()
            setForm(null)
            setMsg({ type: 'ok', text: form.mode === 'create' ? 'Đã thêm địa chỉ' : 'Đã cập nhật địa chỉ' })
            setTimeout(() => setMsg(null), 3000)
        } catch (err) {
            const m = err?.response?.data?.message || 'Lưu thất bại'
            setErrors({ _global: m })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Xoá địa chỉ này?')) return
        try {
            await userApi.deleteAddress(id)
            setAddresses((prev) => prev.filter((a) => a.id !== id))
            setMsg({ type: 'ok', text: 'Đã xoá địa chỉ' })
            setTimeout(() => setMsg(null), 3000)
        } catch {
            setMsg({ type: 'err', text: 'Xoá thất bại' })
        }
    }

    const handleSetDefault = async (id) => {
        try {
            const res = await userApi.setDefault(id)
            setAddresses((prev) =>
                prev.map((a) => ({ ...a, isDefault: a.id === id }))
            )
        } catch {
            setMsg({ type: 'err', text: 'Thất bại' })
        }
    }

    const updateField = (field, value) =>
        setForm((f) => ({ ...f, data: { ...f.data, [field]: value } }))

    // ── Render: Form thêm/sửa ──
    if (form) {
        const d = form.data
        return (
            <div className="flex flex-col gap-5 pb-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setForm(null); setErrors({}) }}
                        className="p-1.5 rounded-[var(--radius-sm)] cursor-pointer"
                        style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg-muted)' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {form.mode === 'create' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
                    </p>
                </div>

                <Field label="Họ và tên người nhận" error={errors.fullName}>
                    <Input value={d.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Nguyễn Văn A" />
                </Field>

                <Field label="Số điện thoại" error={errors.phone}>
                    <Input value={d.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="0901234567" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Tỉnh / Thành phố" error={errors.province}>
                        <Input value={d.province} onChange={(e) => updateField('province', e.target.value)} placeholder="TP. Hồ Chí Minh" />
                    </Field>
                    <Field label="Quận / Huyện" error={errors.district}>
                        <Input value={d.district} onChange={(e) => updateField('district', e.target.value)} placeholder="Quận 1" />
                    </Field>
                </div>

                <Field label="Phường / Xã" error={errors.ward}>
                    <Input value={d.ward} onChange={(e) => updateField('ward', e.target.value)} placeholder="Phường Bến Nghé" />
                </Field>

                <Field label="Địa chỉ chi tiết" error={errors.detail}>
                    <Input value={d.detail} onChange={(e) => updateField('detail', e.target.value)} placeholder="Số nhà, tên đường..." />
                </Field>

                {/* Checkbox default */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                        onClick={() => updateField('isDefault', !d.isDefault)}
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                            background: d.isDefault ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                            border: `1.5px solid ${d.isDefault ? 'var(--color-primary)' : 'var(--color-border-default)'}`,
                        }}
                    >
                        {d.isDefault && <Icon.Check />}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Đặt làm địa chỉ mặc định
                    </span>
                </label>

                {errors._global && (
                    <p className="text-xs px-3 py-2 rounded-[var(--radius-sm)]" style={{ background: '#ef444415', color: '#ef4444' }}>
                        {errors._global}
                    </p>
                )}

                <div className="flex gap-2">
                    <Btn onClick={handleSave} loading={saving}>Lưu địa chỉ</Btn>
                    <Btn variant="ghost" onClick={() => { setForm(null); setErrors({}) }}>Huỷ</Btn>
                </div>
            </div>
        )
    }

    // ── Render: Danh sách ──
    return (
        <div className="flex flex-col gap-4 pb-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Địa chỉ giao hàng
                    {addresses.length > 0 && (
                        <span className="ml-1.5 font-normal normal-case">({addresses.length}/5)</span>
                    )}
                </p>
                {addresses.length < 5 && (
                    <Btn small onClick={() => { setForm({ mode: 'create', data: { ...EMPTY_ADDR } }); setErrors({}) }}>
                        <Icon.Plus /> Thêm
                    </Btn>
                )}
            </div>

            {msg && (
                <p className="text-xs px-3 py-2 rounded-[var(--radius-sm)]"
                    style={{
                        background: msg.type === 'ok' ? '#16a34a15' : '#ef444415',
                        color: msg.type === 'ok' ? '#16a34a' : '#ef4444',
                    }}
                >
                    {msg.text}
                </p>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-8">
                    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0110 10" />
                    </svg>
                </div>
            )}

            {/* Empty */}
            {!loading && addresses.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10" style={{ color: 'var(--color-text-muted)' }}>
                    <Icon.MapPin />
                    <p className="text-sm">Chưa có địa chỉ nào</p>
                    <Btn onClick={() => setForm({ mode: 'create', data: { ...EMPTY_ADDR } })}>
                        <Icon.Plus /> Thêm địa chỉ
                    </Btn>
                </div>
            )}

            {/* Danh sách */}
            {!loading && addresses.map((addr) => (
                <div
                    key={addr.id}
                    className="rounded-[var(--radius-md)] p-4 flex flex-col gap-2 transition-all"
                    style={{
                        border: addr.isDefault
                            ? '1.5px solid var(--color-primary)'
                            : '1.5px solid var(--color-border-subtle)',
                        background: addr.isDefault ? 'var(--color-primary-subtle)' : 'var(--color-bg-muted)',
                    }}
                >
                    {/* Dòng 1: tên + badge default */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                {addr.fullName}
                            </span>
                            {addr.isDefault && (
                                <span
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                                >
                                    <Icon.Star /> Mặc định
                                </span>
                            )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setForm({ mode: 'edit', data: { ...addr } })}
                                className="p-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                                style={{ color: 'var(--color-text-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-subtle)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                title="Chỉnh sửa"
                            >
                                <Icon.Edit />
                            </button>
                            <button
                                onClick={() => handleDelete(addr.id)}
                                className="p-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                                style={{ color: '#ef4444' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#ef444415'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                title="Xoá"
                            >
                                <Icon.Trash />
                            </button>
                        </div>
                    </div>

                    {/* Dòng 2: sđt */}
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{addr.phone}</p>

                    {/* Dòng 3: địa chỉ đầy đủ */}
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                    </p>

                    {/* Set default */}
                    {!addr.isDefault && (
                        <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="self-start text-xs font-medium cursor-pointer mt-1"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            Đặt làm mặc định
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════
// MAIN: ProfileModal (Drawer từ phải)
// ══════════════════════════════════════════════════════════════════
export default function ProfileModal({ isOpen, onClose }) {
    const { user } = useAuthStore()
    const { setUser } = useAuthStore()
    const [tab, setTab] = useState('profile')
    const overlayRef = useRef(null)

    // Đóng khi click overlay
    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose()
    }

    // Đóng khi nhấn Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        if (isOpen) document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, onClose])

    // Khoá scroll body khi drawer mở
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    return (
        <>
            {/* Overlay */}
            <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className="fixed inset-0 transition-all"
                style={{
                    background: 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 'var(--z-modal)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.3s var(--ease-smooth)',
                }}
            />

            {/* Drawer */}
            <div
                className="fixed top-0 right-0 h-full flex flex-col"
                style={{
                    width: 'min(420px, 100vw)',
                    background: 'var(--color-bg-elevated)',
                    zIndex: 'calc(var(--z-modal) + 1)',
                    boxShadow: 'var(--shadow-lg)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.35s var(--ease-spring)',
                }}
            >
                {/* Header cố định */}
                <div
                    className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                    <p className="font-semibold text-base" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                        Tài khoản
                    </p>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                        style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Icon.X />
                    </button>
                </div>

                {/* Tabs */}
                <div
                    className="flex px-5 gap-1 flex-shrink-0 pt-3"
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                    {[
                        { key: 'profile', label: 'Hồ sơ', icon: <Icon.User /> },
                        { key: 'address', label: 'Địa chỉ', icon: <Icon.MapPin /> },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className="flex items-center gap-1.5 px-3 pb-3 text-sm font-medium transition-all cursor-pointer relative"
                            style={{
                                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                                marginBottom: '-1px',
                            }}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Nội dung có scroll */}
                <div className="flex-1 overflow-y-auto px-5 pt-5">
                    {tab === 'profile' && (
                        <ProfileTab user={user} onUserUpdate={(updated) => setUser(updated)} />
                    )}
                    {tab === 'address' && <AddressTab />}
                </div>
            </div>
        </>
    )
}