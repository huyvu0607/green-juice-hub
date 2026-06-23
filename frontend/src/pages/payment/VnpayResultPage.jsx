import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import paymentApi from '@/api/paymentApi'
import './VnpayResultPage.css'


// ── VNPay response code → message tiếng Việt ──────────────────────────────
const VNP_MESSAGES = {
  '07': 'Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.',
  '12': 'Thẻ/Tài khoản bị khóa.',
  '13': 'Sai mật khẩu xác thực (OTP). Vui lòng thử lại.',
  '24': 'Bạn đã huỷ giao dịch.',
  '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Sai mật khẩu thanh toán quá số lần quy định.',
  '99': 'Lỗi không xác định. Vui lòng liên hệ hỗ trợ.',
}

export default function VnpayResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [orderId, setOrderId] = useState('')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'failed'
  const [orderCode, setOrderCode] = useState('')
  const [message, setMessage] = useState('')
  const [responseCode, setResponseCode] = useState('')
  const [countdown, setCountdown] = useState(5)

  // ── Verify kết quả với BE ────────────────────────────────────────────────
  useEffect(() => {
    const verify = async () => {
      try {
        const params = Object.fromEntries(searchParams.entries())
        const res = await paymentApi.verifyVnpayReturn(params)
        const data = res.data

        setOrderCode(data.orderCode || '')
        setResponseCode(data.responseCode || '')
        setOrderId(data.orderId ? String(data.orderId) : '')

        if (data.success) {
          setStatus('success')
          setMessage('Đơn hàng của bạn đang được xử lý.')
        } else {
          setStatus('failed')
          setMessage(
            VNP_MESSAGES[data.responseCode] ||
            data.message ||
            'Vui lòng kiểm tra lại hoặc thử phương thức khác.'
          )
        }
      } catch {
        setStatus('failed')
        setMessage('Không thể xác minh kết quả. Vui lòng kiểm tra lại đơn hàng.')
      }
    }
    verify()
  }, [])

  // ── Countdown + auto redirect khi success ────────────────────────────────
  useEffect(() => {
    if (status !== 'success') return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          navigate(orderId ? `/orders/${orderId}` : '/orders', { replace: true })
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [status])

  return (
    <div className="osm-backdrop vnpr-backdrop">
      <div
        className="osm-card"
        style={{ maxWidth: 400, padding: '32px 28px 28px' }}
      >

        {/* ── LOADING ─────────────────────────────────────────────────────── */}
        {status === 'loading' && (
          <>
            <div className="osm-icon-wrap" style={{ marginBottom: 16 }}>
              <div className="vnpr-spinner" />
            </div>
            <p className="osm-label" style={{ color: 'var(--color-primary)' }}>
              Đang xác minh
            </p>
            <h2 className="osm-title" style={{ fontSize: 20 }}>
              Kiểm tra kết quả thanh toán...
            </h2>
            <p className="osm-sub">Vui lòng không đóng trang này.</p>
          </>
        )}

        {/* ── SUCCESS ─────────────────────────────────────────────────────── */}
        {status === 'success' && (
          <>
            {/* Icon với ripple — giống BankTransferModal khi paid */}
            <div className="osm-icon-wrap" style={{ marginBottom: 16 }}>
              <div className="osm-ripple" />
              <div className="osm-circle">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline className="osm-check" points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <p className="osm-label" style={{ color: 'var(--color-primary)' }}>
              Thành công
            </p>
            <h2 className="osm-title" style={{ fontSize: 20, marginBottom: 4 }}>
              Thanh toán thành công!
            </h2>
            <p className="osm-sub">{message}</p>

            {/* Mã đơn hàng */}
            {orderCode && (
              <p className="osm-code">
                Mã đơn: <span>{orderCode}</span>
              </p>
            )}

            {/* Countdown badge */}
            <div className="vnpr-countdown">
              <div
                className="vnpr-countdown-ring"
                style={{ '--cd': countdown, '--cd-max': 5 }}
              >
                <span>{countdown}</span>
              </div>
              <p>Tự động chuyển đến đơn hàng...</p>
            </div>

            <div className="osm-actions" style={{ marginTop: 8 }}>
              <button
                className="osm-btn osm-btn--primary"
                onClick={() => navigate('/orders', { replace: true })}
              >
                Xem đơn hàng ngay
              </button>
              <Link to="/" className="osm-btn osm-btn--secondary">
                Về trang chủ
              </Link>
            </div>
          </>
        )}

        {/* ── FAILED ──────────────────────────────────────────────────────── */}
        {status === 'failed' && (
          <>
            {/* Icon X đỏ */}
            <div className="osm-icon-wrap" style={{ marginBottom: 16 }}>
              <div className="vnpr-circle-fail">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>

            <p className="osm-label" style={{ color: '#ef4444' }}>
              {responseCode === '24' ? 'Đã huỷ' : 'Thất bại'}
            </p>
            <h2 className="osm-title" style={{ fontSize: 20, marginBottom: 4 }}>
              {responseCode === '24' ? 'Bạn đã huỷ thanh toán' : 'Thanh toán thất bại'}
            </h2>
            <p className="osm-sub">{message}</p>

            {/* Mã đơn hàng */}
            {orderCode && (
              <p className="osm-code" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                Mã đơn: <span style={{ color: '#ef4444' }}>{orderCode}</span>
              </p>
            )}

            {/* Tip */}
            <div className="vnpr-tip">
              💡 Đơn hàng vẫn được giữ lại. Bạn có thể thử thanh toán lại từ trang đơn hàng.
            </div>

            <div className="osm-actions" style={{ marginTop: 4 }}>
              <button
                className="osm-btn osm-btn--primary"
                onClick={() => navigate('/orders', { replace: true })}
              >
                Xem đơn hàng
              </button>
              <Link to="/" className="osm-btn osm-btn--secondary">
                Về trang chủ
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  )
}