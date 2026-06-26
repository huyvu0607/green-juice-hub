import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './OrderSuccessModal.css'
import { BANK_NAME, ACCOUNT_NUMBER, ACCOUNT_NAME, getQrUrl, fmt } from '@/pages/orders/orderHelpers'
import orderApi from '@/api/orderApi'

// ── Màu thương hiệu MoMo ───────────────────────────────────────────────────
const MOMO_COLOR      = '#ae2070'
const MOMO_SUBTLE     = '#fdf2f7'
const MOMO_BORDER     = '#f0b8d4'
const MOMO_MUTED      = '#c4507a'

export default function MomoTransferModal({ order, onClose }) {
  const navigate = useNavigate()
  const [copied, setCopied]     = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [qrError, setQrError]   = useState(false)
  const [showQr, setShowQr]     = useState(true)
  const [paid, setPaid]         = useState(false)
  const [closing, setClosing]   = useState(false)

  const paidRef = useRef(false)

  // Khoá scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Polling 3s — SePay webhook sẽ đánh dấu PAID khi nhận được chuyển khoản
  useEffect(() => {
    const interval = setInterval(async () => {
      if (paidRef.current) return
      try {
        const res = await orderApi.getOrderDetail(order.id)
        if (res.data.paymentStatus === 'PAID') {
          paidRef.current = true
          setPaid(true)
          clearInterval(interval)
          setTimeout(() => {
            setClosing(true)
            setTimeout(() => {
              onClose?.()
              navigate(`/orders/${order.id}`, { state: { fromCheckout: true } })
            }, 400)
          }, 2000)
        }
      } catch { }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(order.orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    if (paid) return
    onClose?.()
    navigate(`/orders/${order?.id}`, { state: { fromCheckout: true } })
  }

  // QR VietQR — cùng tài khoản ngân hàng như BANK_TRANSFER, nội dung là orderCode
  const qrUrl = getQrUrl(order.totalAmount, order.orderCode)

  return (
    <div
      className="osm-backdrop"
      onClick={handleClose}
      style={{
        animation: closing ? 'osm-fade-out 0.4s ease forwards' : undefined,
      }}
    >
      <div
        className="osm-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 400, padding: '28px 28px 24px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* ── Header icon ── */}
        <div className="osm-icon-wrap" style={{ marginBottom: 12 }}>
          {paid ? (
            <>
              <div className="osm-ripple" style={{ borderColor: MOMO_COLOR }} />
              <div className="osm-circle" style={{ background: `linear-gradient(135deg, ${MOMO_COLOR}, ${MOMO_MUTED})` }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline className="osm-check" points="20 6 9 17 4 12" />
                </svg>
              </div>
            </>
          ) : (
            // Logo MoMo chữ M dạng pill — nhận ra ngay, không cần ảnh
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `linear-gradient(135deg, ${MOMO_COLOR}, ${MOMO_MUTED})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto', boxShadow: `0 4px 16px ${MOMO_COLOR}44`,
              fontSize: 26, fontWeight: 900, color: '#fff',
              fontFamily: 'system-ui, sans-serif', letterSpacing: '-1px',
            }}>
              M
            </div>
          )}
        </div>

        {/* ── Tiêu đề ── */}
        {paid ? (
          <>
            <p className="osm-label" style={{ color: MOMO_COLOR }}>Thanh toán thành công!</p>
            <h2 className="osm-title" style={{ fontSize: 20, marginBottom: 4 }}>
              Cảm ơn bạn đã tin tưởng!
            </h2>
            <p className="osm-sub">
              Đơn hàng của bạn đang được xác nhận. Chúng tôi sẽ liên hệ sớm nhất.
            </p>
          </>
        ) : (
          <>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase', color: MOMO_COLOR,
              textAlign: 'center', marginBottom: 4,
            }}>
              Thanh toán qua MoMo
            </p>
            <h2 className="osm-title" style={{ fontSize: 20, marginBottom: 4 }}>
              Hoàn tất đặt hàng
            </h2>
            <p className="osm-sub">
              Chuyển khoản đúng nội dung để đơn được xác nhận tự động.
            </p>
          </>
        )}

        {order?.orderCode && (
          <p className="osm-code">
            Mã đơn: <span>{order.orderCode}</span>
          </p>
        )}

        {/* ── Nội dung thanh toán — ẩn khi đã paid ── */}
        {!paid && (
          <>
            {/* Badge giải thích: MoMo → chuyển khoản ngân hàng liên kết */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px', borderRadius: 10, marginBottom: 14,
              background: MOMO_SUBTLE, border: `1px solid ${MOMO_BORDER}`,
              animation: 'osm-fade-up 0.3s ease 0.2s both', opacity: 0,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 12, color: MOMO_MUTED, lineHeight: 1.5, margin: 0 }}>
                Mở app <strong>MoMo</strong> → Chuyển tiền → Chuyển khoản ngân hàng,
                hoặc quét QR bằng bất kỳ app ngân hàng nào.
              </p>
            </div>

            {/* Toggle QR / Thủ công */}
            <div style={{
              display: 'flex', borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--color-border-subtle)',
              background: 'var(--color-bg-muted)',
              marginBottom: 16,
              animation: 'osm-fade-up 0.4s ease 0.4s both', opacity: 0,
            }}>
              {[{ key: true, label: '📷 Quét QR' }, { key: false, label: '🏦 Thủ công' }].map(({ key, label }) => (
                <button
                  key={String(key)}
                  onClick={() => setShowQr(key)}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: showQr === key ? MOMO_COLOR : 'transparent',
                    color: showQr === key ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* QR Code */}
            {showQr && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                marginBottom: 16,
                animation: 'osm-fade-up 0.4s ease 0.5s both', opacity: 0,
              }}>
                <div style={{
                  width: 200, height: qrLoaded ? 'auto' : 200,
                  borderRadius: 12, overflow: 'hidden',
                  border: `1.5px solid ${MOMO_BORDER}`,
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {qrError ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <span style={{ fontSize: 28 }}>⚠️</span>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                        Không tải được mã QR
                      </p>
                    </div>
                  ) : (
                    <>
                      {!qrLoaded && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            border: `2px solid ${MOMO_COLOR}`,
                            borderTopColor: 'transparent',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                        </div>
                      )}
                      <img
                        src={qrUrl} alt="VietQR MoMo"
                        style={{ width: 200, display: qrLoaded ? 'block' : 'none' }}
                        onLoad={() => setQrLoaded(true)}
                        onError={() => setQrError(true)}
                      />
                    </>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Hỗ trợ tất cả app ngân hàng &amp; ví MoMo
                </p>
              </div>
            )}

            {/* Thông tin chuyển khoản thủ công */}
            {!showQr && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12,
                animation: 'osm-fade-up 0.3s ease both', opacity: 0,
              }}>
                {[
                  { label: 'Ngân hàng',     value: BANK_NAME },
                  { label: 'Số tài khoản',  value: ACCOUNT_NUMBER, mono: true },
                  { label: 'Chủ tài khoản', value: ACCOUNT_NAME },
                  { label: 'Số tiền',       value: fmt(order.totalAmount), highlight: true },
                ].map(({ label, value, mono, highlight }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      fontFamily: mono ? 'monospace' : undefined,
                      color: highlight ? MOMO_COLOR : 'var(--color-text-primary)',
                    }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Nội dung CK + Copy — màu MoMo */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', borderRadius: 10, marginBottom: 8,
              background: MOMO_SUBTLE, border: `1.5px solid ${MOMO_COLOR}`,
              animation: 'osm-fade-up 0.4s ease 0.7s both', opacity: 0,
            }}>
              <div>
                <p style={{ fontSize: 11, color: MOMO_MUTED, margin: 0 }}>
                  Nội dung chuyển khoản
                </p>
                <p style={{
                  fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
                  color: MOMO_COLOR, margin: '2px 0 0',
                }}>
                  {order.orderCode}
                </p>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: copied ? '#16a34a' : MOMO_COLOR,
                  color: '#fff', flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                {copied ? '✓ Đã copy' : 'Copy'}
              </button>
            </div>

            <p style={{ fontSize: 11, color: MOMO_MUTED, textAlign: 'center', marginBottom: 16 }}>
              ⚠️ Ghi đúng nội dung để đơn được xác nhận tự động
            </p>

            <div className="osm-actions">
              <button className="osm-btn osm-btn--secondary" onClick={handleClose}>
                Xem đơn hàng
              </button>
            </div>
          </>
        )}

        {paid && (
          <div className="osm-actions" style={{ marginTop: 16 }}>
            <button
              className="osm-btn osm-btn--primary"
              style={{ background: MOMO_COLOR }}
              onClick={() => {
                onClose?.()
                navigate(`/orders/${order.id}`, { state: { fromCheckout: true } })
              }}
            >
              Xem đơn hàng
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin        { to { transform: rotate(360deg) } }
        @keyframes osm-fade-out { from { opacity: 1 } to { opacity: 0 } }
      `}</style>
    </div>
  )
}