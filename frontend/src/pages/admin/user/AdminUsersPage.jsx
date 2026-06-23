import { useEffect, useState, useCallback } from 'react'
import adminUserApi from '@/api/adminUserApi'
import useAuthStore from '@/store/authStore'


// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(value || 0)
}

const ROLE_LABELS = {
  CUSTOMER: { label: 'Khách hàng', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  STAFF: { label: 'Nhân viên', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ADMIN: { label: 'Quản trị', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_LABELS[role] || { label: role, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      Đã khoá
    </span>
  )
}

function Avatar({ user }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
      {(user.name || user.phone || '?')[0].toUpperCase()}
    </div>
  )
}

// ─── Modal: Gán role ─────────────────────────────────────────────────────────

function RoleModal({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (user.role === 'ADMIN') { onClose(); return }
    if (role === user.role) { onClose(); return }
    setLoading(true); setError('')
    try {
      const res = await adminUserApi.updateRole(user.id, role)
      onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-base font-semibold text-gray-900">Gán quyền</h3>
        <p className="mb-4 text-sm text-gray-500">
          {user.name || user.phone} · #{user.id}
        </p>

        <div className="space-y-2">
          {Object.entries(ROLE_LABELS).map(([value, cfg]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${role === value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <input
                type="radio" name="role" value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="accent-green-600"
              />
              <span className={`text-sm font-medium ${role === value ? 'text-green-700' : 'text-gray-700'}`}>
                {cfg.label}
              </span>
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Tạo mã cá nhân ───────────────────────────────────────────────────

function PersonalPromoModal({ user, onClose, onCreated }) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1)

  const toInputVal = (d) => d.toISOString().slice(0, 16)

  const [form, setForm] = useState({
    code: '',
    name: `Ưu đãi dành riêng cho ${user.name || user.phone}`,
    type: 'PERCENT',
    value: '',
    minOrderValue: '0',
    freeShipping: false,
    maxUsesPerUser: 1,
    startsAt: toInputVal(tomorrow),
    endsAt: toInputVal(nextMonth),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.value) {
      setError('Vui lòng nhập đủ mã và giá trị giảm'); return
    }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        value: parseFloat(form.value),
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }
      const res = await adminUserApi.createPersonalPromo(user.id, payload)
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200'
  const labelCls = 'mb-1 block text-xs font-medium text-gray-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-base font-semibold text-gray-900">Tạo mã khuyến mãi cá nhân</h3>
        <p className="mb-5 text-sm text-gray-500">
          Dành riêng cho {user.name || user.phone} · #{user.id}
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Mã khuyến mãi *</label>
              <input className={inputCls} placeholder="VD: VIP2026"
                value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelCls}>Loại giảm *</label>
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="PERCENT">% giảm giá</option>
                <option value="FIXED">Số tiền cố định</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Tên chương trình *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                {form.type === 'PERCENT' ? 'Giá trị (%)' : 'Số tiền giảm (đ)'} *
              </label>
              <input className={inputCls} type="number" min="0" placeholder="0"
                value={form.value} onChange={e => set('value', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Đơn tối thiểu (đ)</label>
              <input className={inputCls} type="number" min="0" placeholder="0"
                value={form.minOrderValue} onChange={e => set('minOrderValue', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bắt đầu</label>
              <input className={inputCls} type="datetime-local"
                value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Kết thúc</label>
              <input className={inputCls} type="datetime-local"
                value={form.endsAt} onChange={e => set('endsAt', e.target.value)} />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.freeShipping}
              onChange={e => set('freeShipping', e.target.checked)}
              className="h-4 w-4 rounded accent-green-600" />
            Miễn phí vận chuyển
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Huỷ</button>
          <button onClick={handleSubmit} disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
            {loading ? 'Đang tạo...' : 'Tạo mã'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const currentUser = useAuthStore(state => state.user)

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modals
  const [roleModal, setRoleModal] = useState(null)   // user object
  const [promoModal, setPromoModal] = useState(null)   // user object
  const [toggling, setToggling] = useState(null)   // userId being toggled

  //helper 
  const isProtected = (user) =>
    user.role === 'ADMIN' || user.id === currentUser?.id
  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword)
    }, 400)
    return () => clearTimeout(timer)
  }, [keyword])

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        ...(keyword.trim() && { keyword: keyword.trim() }),
        ...(role && { role }),
        ...(isActive !== '' && { isActive: isActive === 'true' }),
      }
      const res = await adminUserApi.getUsers(params)
      setUsers(res.data.content)
      setTotal(res.data.totalElements)
    } catch {
      setError('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedKeyword, role, isActive])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Reset về trang 0 khi filter thay đổi
  useEffect(() => { setPage(0) }, [debouncedKeyword, role, isActive])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleToggleActive = async (user) => {
    setToggling(user.id)
    try {
      const res = await adminUserApi.toggleActive(user.id)
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u))
    } catch {
      alert('Có lỗi khi thay đổi trạng thái')
    } finally {
      setToggling(null)
    }
  }

  const handleRoleSaved = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Người dùng</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} tài khoản</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Tìm tên, SĐT, email, username..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Tất cả quyền</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="STAFF">Nhân viên</option>
          <option value="ADMIN">Quản trị</option>
        </select>
        <select
          value={isActive}
          onChange={e => setIsActive(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã khoá</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">SĐT</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Quyền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* Người dùng */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div>
                          <p className="font-medium text-gray-900">{user.name || '—'}</p>
                          {user.username && (
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* SĐT */}
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        {user.phone}
                        {user.phoneVerifiedAt && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="h-3.5 w-3.5 shrink-0 text-green-500" title="Đã xác thực">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-gray-500">{user.email || '—'}</td>
                    {/* Quyền */}
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    {/* Trạng thái */}
                    <td className="px-4 py-3"><StatusBadge isActive={user.isActive} /></td>
                    {/* Ngày tạo */}
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    {/* Hành động */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Khoá / Mở khoá */}
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={toggling === user.id}
                          title={user.isActive ? 'Khoá tài khoản' : 'Mở khoá'}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition
                            ${user.isActive
                              ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                            } disabled:opacity-50`}
                        >
                          {toggling === user.id ? '...' : user.isActive ? 'Khoá' : 'Mở khoá'}
                        </button>

                        {/* Gán quyền */}
                        <button
                          onClick={() => setRoleModal(user)}
                          disabled={user.role === 'ADMIN'}
                          title={user.role === 'ADMIN' ? 'Không thể thay đổi quyền Admin' : undefined}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Quyền
                        </button>

                        {/* Tạo mã cá nhân — chỉ dành cho CUSTOMER */}
                        {user.role === 'CUSTOMER' && (
                          <button
                            onClick={() => setPromoModal(user)}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
                          >
                            Tặng mã
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Hiển thị {users.length} / {total} người dùng
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => {
              const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, page - 3)) + i
              if (pageNum >= totalPages) return null
              return (
                <button key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`rounded-lg px-3 py-1.5 transition ${page === pageNum
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  {pageNum + 1}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {roleModal && <RoleModal user={roleModal} onClose={() => setRoleModal(null)} onSaved={handleRoleSaved} />}
      {promoModal && <PersonalPromoModal user={promoModal} onClose={() => setPromoModal(null)} onCreated={() => { }} />}
    </div>
  )
}