// ══════════════════════════════════════════════════════════════════
// LocationSelect.jsx
// Combobox cascade: Tỉnh → Huyện → Xã (gõ để lọc nhanh)
// API: https://provinces.open-api.vn
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'

const API = 'https://provinces.open-api.vn/api'

// ── Combobox: click mở dropdown + gõ để lọc ───────────────────────
function Combobox({ label, value, options, onChange, loading, disabled, error, placeholder }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const inputRef = useRef(null)
    const listRef = useRef(null)
    const ref = useRef(null)

    // Đóng khi click ngoài
    useEffect(() => {
        const handler = (e) => {
            if (!ref.current?.contains(e.target)) {
                setOpen(false)
                setQuery('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Focus input khi mở
    useEffect(() => {
        if (open) inputRef.current?.focus()
    }, [open])

    const selected = options.find((o) => o.code === value)

    // Lọc theo query (bỏ dấu để tìm kiếm tốt hơn)
    const normalize = (str) =>
        str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const filtered = query.trim()
        ? options.filter((o) => normalize(o.name).includes(normalize(query)))
        : options

    const handleOpen = () => {
        if (disabled || loading) return
        setOpen(true)
        setQuery('')
    }

    const handleSelect = (opt) => {
        onChange(opt)
        setOpen(false)
        setQuery('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }

    return (
        <div ref={ref} className="flex flex-col gap-1">
            {label && (
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Trigger / Input */}
                <div
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm flex items-center justify-between transition-all"
                    style={{
                        background: 'var(--color-bg-muted)',
                        border: `1.5px solid ${open ? 'var(--color-primary)' : error ? '#ef4444' : 'var(--color-border-subtle)'}`,
                        boxShadow: open ? 'var(--shadow-glow)' : 'none',
                        cursor: disabled || loading ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                    }}
                    onClick={handleOpen}
                >
                    {open ? (
                        /* Đang mở: hiện input gõ lọc */
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`Tìm ${label?.toLowerCase() || ''}...`}
                            className="flex-1 outline-none bg-transparent text-sm min-w-0"
                            style={{ color: 'var(--color-text-primary)' }}
                        />
                    ) : (
                        /* Đang đóng: hiện tên đã chọn hoặc placeholder */
                        <span
                            className="truncate flex-1"
                            style={{ color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                        >
                            {loading ? 'Đang tải...' : selected ? selected.name : placeholder}
                        </span>
                    )}

                    {/* Icon bên phải */}
                    <span
                        className="flex-shrink-0 ml-2 transition-transform"
                        style={{
                            color: 'var(--color-text-muted)',
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    >
                        {loading
                            ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                <path d="M12 2a10 10 0 0110 10" />
                            </svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        }
                    </span>
                </div>

                {/* Dropdown list */}
                {open && (
                    <div
                        ref={listRef}
                        className="absolute left-0 right-0 top-full mt-1 rounded-[var(--radius-md)] z-50"
                        style={{
                            background: 'var(--color-bg-elevated)',
                            border: '1.5px solid var(--color-border-subtle)',
                            boxShadow: 'var(--shadow-lg)',
                            maxHeight: '220px',
                            overflowY: 'auto',
                        }}
                    >
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                                {query ? `Không tìm thấy "${query}"` : 'Không có dữ liệu'}
                            </div>
                        ) : (
                            filtered.map((opt) => {
                                const isSelected = value === opt.code
                                // Highlight phần khớp query
                                const highlight = (name) => {
                                    if (!query.trim()) return name
                                    const idx = normalize(name).indexOf(normalize(query))
                                    if (idx === -1) return name
                                    return (
                                        <>
                                            {name.slice(0, idx)}
                                            <mark style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)', borderRadius: '2px' }}>
                                                {name.slice(idx, idx + query.length)}
                                            </mark>
                                            {name.slice(idx + query.length)}
                                        </>
                                    )
                                }
                                return (
                                    <div
                                        key={opt.code}
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect(opt) }}
                                        className="px-3 py-2 text-sm cursor-pointer transition-colors"
                                        style={{
                                            background: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                            fontWeight: isSelected ? 600 : 400,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-muted)'
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent'
                                        }}
                                    >
                                        {highlight(opt.name)}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>

            {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
        </div>
    )
}

// ── LocationSelect (component chính export ra ngoài) ───────────────
/**
 * Props:
 *   value        = { province, district, ward }  (tên string)
 *   onChange(v)  = gọi với { province, district, ward } (tên string)
 *   errors       = { province?, district?, ward? }
 */
export default function LocationSelect({ value = {}, onChange, errors = {} }) {
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [wards, setWards] = useState([])

    const [selectedProvince, setSelectedProvince] = useState(null)
    const [selectedDistrict, setSelectedDistrict] = useState(null)
    const [selectedWard, setSelectedWard] = useState(null)

    const [loadingProv, setLoadingProv] = useState(true)
    const [loadingDist, setLoadingDist] = useState(false)
    const [loadingWard, setLoadingWard] = useState(false)

    // Load tỉnh khi mount
    useEffect(() => {
        fetch(`${API}/?depth=1`)
            .then((r) => r.json())
            .then((data) => setProvinces(data))
            .catch(console.error)
            .finally(() => setLoadingProv(false))
    }, [])

    // Khôi phục selection khi edit mode (chạy sau khi provinces load)
    useEffect(() => {
        if (!provinces.length) return
        if (!value.province) return

        const prov = provinces.find((p) => p.name === value.province)
        if (!prov || selectedProvince?.code === prov.code) return

        setSelectedProvince(prov)
        setLoadingDist(true)
        fetch(`${API}/p/${prov.code}?depth=2`)
            .then((r) => r.json())
            .then((data) => {
                const dists = data.districts || []
                setDistricts(dists)
                if (value.district) {
                    const dist = dists.find((d) => d.name === value.district)
                    if (dist) {
                        setSelectedDistrict(dist)
                        setLoadingWard(true)
                        fetch(`${API}/d/${dist.code}?depth=2`)
                            .then((r) => r.json())
                            .then((data2) => {
                                const ws = data2.wards || []
                                setWards(ws)
                                if (value.ward) {
                                    const ward = ws.find((w) => w.name === value.ward)
                                    if (ward) setSelectedWard(ward)
                                }
                            })
                            .finally(() => setLoadingWard(false))
                    }
                }
            })
            .finally(() => setLoadingDist(false))
    }, [provinces])

    const handleProvince = (prov) => {
        setSelectedProvince(prov)
        setSelectedDistrict(null)
        setSelectedWard(null)
        setDistricts([])
        setWards([])
        onChange({ province: prov.name, district: '', ward: '' })

        setLoadingDist(true)
        fetch(`${API}/p/${prov.code}?depth=2`)
            .then((r) => r.json())
            .then((data) => setDistricts(data.districts || []))
            .catch(console.error)
            .finally(() => setLoadingDist(false))
    }

    const handleDistrict = (dist) => {
        setSelectedDistrict(dist)
        setSelectedWard(null)
        setWards([])
        onChange({ province: selectedProvince?.name || '', district: dist.name, ward: '' })

        setLoadingWard(true)
        fetch(`${API}/d/${dist.code}?depth=2`)
            .then((r) => r.json())
            .then((data) => setWards(data.wards || []))
            .catch(console.error)
            .finally(() => setLoadingWard(false))
    }

    const handleWard = (ward) => {
        setSelectedWard(ward)
        onChange({
            province: selectedProvince?.name || '',
            district: selectedDistrict?.name || '',
            ward: ward.name,
        })
    }

    return (
        <>
            <Combobox
                label="Tỉnh / Thành phố"
                value={selectedProvince?.code}
                options={provinces}
                onChange={handleProvince}
                loading={loadingProv}
                placeholder="Chọn tỉnh / thành phố"
                error={errors.province}
            />

            <Combobox
                label="Quận / Huyện"
                value={selectedDistrict?.code}
                options={districts}
                onChange={handleDistrict}
                loading={loadingDist}
                disabled={!selectedProvince}
                placeholder={selectedProvince ? 'Chọn quận / huyện' : 'Chọn tỉnh trước'}
                error={errors.district}
            />

            <Combobox
                label="Phường / Xã"
                value={selectedWard?.code}
                options={wards}
                onChange={handleWard}
                loading={loadingWard}
                disabled={!selectedDistrict}
                placeholder={selectedDistrict ? 'Chọn phường / xã' : 'Chọn huyện trước'}
                error={errors.ward}
            />
        </>
    )
}