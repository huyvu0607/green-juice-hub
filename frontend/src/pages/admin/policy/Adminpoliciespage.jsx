import { useEffect, useState, useCallback } from 'react'
import adminPolicyApi from '@/api/adminPolicyApi'
import RichTextEditor from '@/components/common/RichTextEditor'
import { useAdminRole } from '@/hooks/useAdminRole'

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons = {
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  fileText: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  // ── Policy type icons ──
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v4h-7V8Z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  return: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  ),
  terms: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  ),
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLICY_META = {
  SHIPPING: { label: 'Vận chuyển', color: 'blue',   icon: icons.truck  },
  RETURN:   { label: 'Đổi trả',    color: 'orange', icon: icons.return },
  WARRANTY: { label: 'Bảo hành',   color: 'purple', icon: icons.shield },
  TERMS:    { label: 'Điều khoản', color: 'gray',   icon: icons.terms  },
}

const COLOR_MAP = {
  blue:   { badge: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500'   },
  orange: { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  purple: { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  gray:   { badge: 'bg-gray-50 text-gray-700 border-gray-200',     dot: 'bg-gray-400'   },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── PolicyEditModal ──────────────────────────────────────────────────────────

function PolicyEditModal({ policy, onClose, onSaved }) {
  const [form, setForm] = useState({
    type:      policy.type,
    title:     policy.title     || '',
    content:   policy.content   || '',
    sortOrder: policy.sortOrder ?? 0,
    isActive:  policy.isActive  ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.title.trim())   { setError('Vui lòng nhập tiêu đề'); return }
    if (!form.content.trim()) { setError('Vui lòng nhập nội dung'); return }

    setLoading(true); setError('')
    try {
      const payload = {
        type:      form.type,
        title:     form.title.trim(),
        content:   form.content,
        sortOrder: Number(form.sortOrder) || 0,
        isActive:  form.isActive,
      }
      const res = await adminPolicyApi.update(policy.id, payload)
      onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const meta   = POLICY_META[policy.type] || { label: policy.type, color: 'gray', icon: icons.fileText }
  const colors = COLOR_MAP[meta.color]    || COLOR_MAP.gray

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200'
  const labelCls = 'mb-1 block text-xs font-medium text-gray-600'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colors.badge}`}>
              <span className="h-3.5 w-3.5">{meta.icon}</span>
              {meta.label}
            </span>
            <h3 className="text-base font-semibold text-gray-900">Chỉnh sửa chính sách</h3>
          </div>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <span className="h-5 w-5 block">{icons.x}</span>
          </button>
        </div>

        <div className="space-y-4 p-6">

          {/* Tiêu đề */}
          <div>
            <label className={labelCls}>Tiêu đề *</label>
            <input
              className={inputCls}
              placeholder="VD: Chính sách vận chuyển"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Nội dung */}
          <div>
            <label className={labelCls}>Nội dung *</label>
            <RichTextEditor
              value={form.content}
              onChange={val => set('content', val)}
            />
          </div>

          {/* Sort order + isActive */}
          <div className="flex items-center gap-4">
            <div className="w-36">
              <label className={labelCls}>Thứ tự hiển thị</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={e => set('sortOrder', e.target.value)}
              />
            </div>
            <div className="flex flex-1 items-center gap-2 pt-5">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-gray-700">
                {form.isActive ? 'Hiển thị trên trang public' : 'Đang ẩn'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <p className="px-6 pb-2 text-sm text-red-500">{error}</p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang lưu...
              </>
            ) : (
              <>
                <span className="h-3.5 w-3.5 block">{icons.check}</span>
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PolicyCard ───────────────────────────────────────────────────────────────

function PolicyCard({ policy, onEdit, onToggle, toggling, canWrite }) {
  const meta    = POLICY_META[policy.type] || { label: policy.type, color: 'gray', icon: icons.fileText }
  const colors  = COLOR_MAP[meta.color]    || COLOR_MAP.gray
  const preview = stripHtml(policy.content)

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all
      ${policy.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}
    `}>
      {/* Top color bar */}
      <div className={`h-1 w-full ${colors.dot}`} />

      <div className="flex flex-1 flex-col p-5">

        {/* Header row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colors.badge}`}>
              <span className="h-3.5 w-3.5">{meta.icon}</span>
              {meta.label}
            </span>
            {policy.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Hiển thị
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                Ẩn
              </span>
            )}
          </div>
          <span className="shrink-0 text-xs text-gray-400">#{policy.sortOrder}</span>
        </div>

        {/* Title */}
        <h3 className="mb-2 font-semibold text-gray-900 line-clamp-1">{policy.title}</h3>

        {/* Preview */}
        <p className="mb-4 flex-1 text-sm text-gray-500 line-clamp-3">
          {preview || <span className="italic text-gray-300">Chưa có nội dung</span>}
        </p>

        {/* Updated at */}
        <p className="mb-4 text-xs text-gray-400">
          Cập nhật: {formatDate(policy.updatedAt)}
        </p>

        {/* Actions */}
        {canWrite && (
          <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
            {/* Toggle */}
            <button
              onClick={() => onToggle(policy)}
              disabled={toggling === policy.id}
              title={policy.isActive ? 'Ẩn khỏi trang public' : 'Hiện trên trang public'}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition
                ${policy.isActive
                  ? 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                } disabled:opacity-50`}
            >
              <span className="h-3.5 w-3.5">
                {policy.isActive ? icons.eyeOff : icons.eye}
              </span>
              {toggling === policy.id ? '...' : policy.isActive ? 'Ẩn' : 'Hiện'}
            </button>

            {/* Sửa */}
            <button
              onClick={() => onEdit(policy)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <span className="h-3.5 w-3.5">{icons.edit}</span>
              Chỉnh sửa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PolicySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-1 w-full animate-pulse bg-gray-100" />
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
        <div className="flex gap-2 border-t border-gray-100 pt-4">
          <div className="h-7 w-16 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-7 w-24 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPoliciesPage() {
  const { canWrite } = useAdminRole()

  const [policies, setPolicies] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [editModal, setEditModal] = useState(null)   // null | policy object
  const [toggling, setToggling]   = useState(null)   // policy id

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPolicies = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminPolicyApi.getAll()
      setPolicies(res.data)
    } catch {
      setError('Không thể tải danh sách chính sách')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPolicies() }, [fetchPolicies])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSaved = (updatedPolicy) => {
    setPolicies(prev =>
      prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p)
    )
  }

  const handleToggle = async (policy) => {
    setToggling(policy.id)
    try {
      const res = await adminPolicyApi.toggleActive(policy.id)
      setPolicies(prev => prev.map(p => p.id === policy.id ? res.data : p))
    } catch {
      alert('Có lỗi khi thay đổi trạng thái')
    } finally {
      setToggling(null)
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const activeCount = policies.filter(p => p.isActive).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Chính sách</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {policies.length} chính sách
            {activeCount > 0 && (
              <span className="ml-1 text-green-600">· {activeCount} đang hiển thị</span>
            )}
            {policies.length - activeCount > 0 && (
              <span className="ml-1 text-gray-400">· {policies.length - activeCount} đang ẩn</span>
            )}
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <span className="mt-0.5 h-4 w-4 shrink-0 text-blue-500">{icons.info}</span>
        <p className="text-sm text-blue-700">
          Mỗi loại chính sách chỉ có 1 nội dung. Nhấn <strong>Chỉnh sửa</strong> để cập nhật nội dung hiển thị trên trang public.
          Dùng <strong>Ẩn / Hiện</strong> để kiểm soát chính sách nào khách hàng thấy được.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {loading
          ? [...Array(4)].map((_, i) => <PolicySkeleton key={i} />)
          : policies.length === 0
            ? (
              <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
                <span className="mb-3 h-12 w-12 text-gray-300">{icons.fileText}</span>
                <p className="text-sm font-medium text-gray-500">Chưa có chính sách nào</p>
                <p className="mt-1 text-xs text-gray-400">Dữ liệu chính sách sẽ xuất hiện ở đây</p>
              </div>
            )
            : policies.map(policy => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onEdit={p => setEditModal(p)}
                onToggle={handleToggle}
                toggling={toggling}
                canWrite={canWrite}
              />
            ))
        }
      </div>

      {/* Edit modal */}
      {editModal && (
        <PolicyEditModal
          policy={editModal}
          onClose={() => setEditModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}