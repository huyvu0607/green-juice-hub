import { useState } from 'react'

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

// ── Cấu hình ngân hàng ─────────────────────────────────────────────
// Thay BANK_BIN và ACCOUNT_NUMBER theo tài khoản thật của bạn
const BANK_BIN = '970436'       // Vietcombank BIN (970436)
const ACCOUNT_NUMBER = '1234567890'
const ACCOUNT_NAME = 'NGUYEN VAN A'
const BANK_NAME = 'Vietcombank'

// VietQR API: https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT}-{TEMPLATE}.png
// Template "compact2" hiện đủ logo + QR gọn
const getQrUrl = (amount, content) =>
  `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NUMBER}-compact2.png` +
  `?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`

export default function BankTransferModal({ order, onClose }) {
  const [copied, setCopied] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [qrError, setQrError] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(order.orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrUrl = getQrUrl(order.totalAmount, order.orderCode)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.25s ease' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>

      <div
        className="w-full max-w-sm rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 text-center" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: '#16a34a20' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Đặt hàng thành công!</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Quét mã QR hoặc chuyển khoản thủ công để xác nhận đơn
          </p>
        </div>

        {/* QR Code */}
        <div className="px-5 pt-4 flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Quét mã QR thanh toán
          </p>

          <div
            className="rounded-[var(--radius-md)] overflow-hidden flex items-center justify-center"
            style={{
              width: 220,
              height: qrLoaded ? 'auto' : 220,
              background: 'var(--color-bg-muted)',
              border: '1.5px solid var(--color-border-subtle)',
            }}
          >
            {qrError ? (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <span style={{ fontSize: 32 }}>⚠️</span>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Không tải được mã QR
                </p>
              </div>
            ) : (
              <>
                {/* Skeleton khi đang load */}
                {!qrLoaded && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                    />
                  </div>
                )}
                <img
                  src={qrUrl}
                  alt="VietQR"
                  style={{ width: 220, display: qrLoaded ? 'block' : 'none' }}
                  onLoad={() => setQrLoaded(true)}
                  onError={() => setQrError(true)}
                />
              </>
            )}
          </div>

          <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Hỗ trợ tất cả app ngân hàng Việt Nam
          </p>
        </div>

        {/* Divider "hoặc" */}
        <div className="px-5 py-3 flex items-center gap-3">
          <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>hoặc chuyển khoản thủ công</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
        </div>

        {/* Bank info */}
        <div className="px-5 pb-4 flex flex-col gap-3">
          {[
            { label: 'Ngân hàng',      value: BANK_NAME },
            { label: 'Số tài khoản',   value: ACCOUNT_NUMBER, mono: true },
            { label: 'Chủ tài khoản',  value: ACCOUNT_NAME },
            { label: 'Số tiền',        value: fmt(order.totalAmount), highlight: true },
          ].map(({ label, value, mono, highlight }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              <span
                className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}
                style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
              >
                {value}
              </span>
            </div>
          ))}

          {/* Nội dung CK + Copy */}
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

          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            ⚠️ Ghi đúng nội dung để đơn được xác nhận tự động
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            Xem đơn hàng
          </button>
        </div>
      </div>
    </div>
  )
}