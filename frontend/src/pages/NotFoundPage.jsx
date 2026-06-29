// ══════════════════════════════════════════════════════════════════
// NotFoundPage.jsx — /404 & catch-all route
// Match design system Green Juice Hub (CSS variables)
// ══════════════════════════════════════════════════════════════════
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dots, setDots] = useState('.')

  // Hiệu ứng dấu chấm nhấp nháy
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {/* ── Illustration ── */}
      <div style={{ width: '100%', maxWidth: 340, marginBottom: 32 }}>
        <svg
          viewBox="0 0 340 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto' }}
          role="img"
          aria-label="Ly nước ép bị đổ với dấu chấm hỏi"
        >
          {/* Nền blob tròn nhạt */}
          <ellipse
            cx="170" cy="220"
            rx="130" ry="20"
            fill="var(--color-primary-subtle, #e8f5e9)"
          />

          {/* Puddle / vũng nước đổ */}
          <ellipse
            cx="170" cy="218"
            rx="90" ry="13"
            fill="var(--color-primary-muted, #c8e6c9)"
            opacity="0.6"
          />

          {/* Thân ly bị nghiêng */}
          <g transform="translate(100, 60) rotate(25, 70, 90)">
            {/* Thân ly */}
            <path
              d="M20 0 L120 0 L105 140 L35 140 Z"
              rx="6"
              fill="var(--color-bg-elevated, #ffffff)"
              stroke="var(--color-primary, #4caf50)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Liquid bên trong */}
            <path
              d="M28 30 L112 30 L100 130 L40 130 Z"
              fill="var(--color-primary, #4caf50)"
              opacity="0.25"
            />
            {/* Đường kẻ highlight trên ly */}
            <line
              x1="35" y1="10" x2="35" y2="70"
              stroke="var(--color-primary, #4caf50)"
              strokeWidth="2"
              strokeOpacity="0.3"
              strokeLinecap="round"
            />
            {/* Ống hút */}
            <rect
              x="82" y="-50" width="8" height="90"
              rx="4"
              fill="var(--color-primary, #4caf50)"
              opacity="0.7"
            />
            {/* Đầu ống hút */}
            <circle cx="86" cy="-52" r="5" fill="var(--color-primary, #4caf50)" opacity="0.7" />
            {/* Đáy ly */}
            <rect
              x="35" y="138" width="70" height="10"
              rx="5"
              fill="var(--color-primary, #4caf50)"
              opacity="0.5"
            />
          </g>

          {/* Các giọt nước đổ ra */}
          <circle cx="95" cy="185" r="6" fill="var(--color-primary, #4caf50)" opacity="0.4" />
          <circle cx="115" cy="198" r="4" fill="var(--color-primary, #4caf50)" opacity="0.3" />
          <circle cx="78" cy="196" r="3" fill="var(--color-primary, #4caf50)" opacity="0.25" />
          <circle cx="130" cy="188" r="5" fill="var(--color-primary, #4caf50)" opacity="0.35" />

          {/* Dấu ? lớn bên phải */}
          <text
            x="255" y="155"
            fontSize="90"
            fontWeight="700"
            fontFamily="var(--font-display, sans-serif)"
            fill="var(--color-primary, #4caf50)"
            opacity="0.15"
            textAnchor="middle"
          >
            ?
          </text>

          {/* Text "404" nhỏ trên ly */}
          <text
            x="170" y="50"
            fontSize="13"
            fontWeight="600"
            fontFamily="var(--font-display, sans-serif)"
            fill="var(--color-text-muted, #9e9e9e)"
            textAnchor="middle"
            letterSpacing="3"
          >
            404
          </text>
        </svg>
      </div>

      {/* ── Text content ── */}
      <h1
        style={{
          fontSize: 'clamp(22px, 5vw, 28px)',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text-primary)',
          margin: '0 0 10px',
        }}
      >
        Trang không tồn tại
      </h1>

      <p
        style={{
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          maxWidth: 320,
          lineHeight: 1.7,
          margin: '0 0 8px',
        }}
      >
        Có vẻ như trang bạn tìm không còn ở đây nữa — hoặc chưa từng tồn tại.
      </p>

      {/* Hiển thị URL sai */}
      <p
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          fontFamily: 'monospace',
          background: 'var(--color-bg-muted)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          margin: '0 0 28px',
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {location.pathname}
      </p>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            height: 40,
            padding: '0 22px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Về trang chủ
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            height: 40,
            padding: '0 22px',
            borderRadius: 'var(--radius-pill)',
            border: '1.5px solid var(--color-border-default)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-strong)'
            e.currentTarget.style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-default)'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Quay lại
        </button>
      </div>

      {/* Gợi ý nhỏ */}
      <p
        style={{
          marginTop: 32,
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}
      >
        Hoặc thử tìm kiếm sản phẩm{' '}
        <button
          onClick={() => navigate('/products')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--color-primary)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          tại đây{dots}
        </button>
      </p>
    </div>
  )
}