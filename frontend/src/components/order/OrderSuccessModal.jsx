import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCartStore from '@/store/useCartStore'
import './OrderSuccessModal.css'

export default function OrderSuccessModal({ order, onClose }) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Đếm ngược 5 giây rồi chuyển sang trang chi tiết đơn
  useEffect(() => {
    if (countdown <= 0) {
      handleViewOrder()
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleViewOrder = () => {
    onClose?.()
    navigate(`/orders/${order?.id}`, { state: { fromCheckout: true } })
  }

  const handleContinue = () => {
    onClose?.()
    navigate('/products')
  }

  return (
    <div className="osm-backdrop" onClick={handleViewOrder}>
      <div className="osm-card" onClick={(e) => e.stopPropagation()}>

        {/* ── Circle + checkmark ── */}
        <div className="osm-icon-wrap">
          <div className="osm-ripple" />
          <div className="osm-circle">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline className="osm-check" points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* ── Text ── */}
        <p className="osm-label">Đặt hàng thành công</p>
        <h2 className="osm-title">Cảm ơn bạn đã tin tưởng!</h2>
        <p className="osm-sub">Đơn hàng của bạn đã được ghi nhận.</p>
        {order?.orderCode && (
          <p className="osm-code">
            Mã đơn: <span>{order.orderCode}</span>
          </p>
        )}

        {/* ── Countdown ── */}
        <p className="osm-countdown">
          Tự động chuyển sang đơn hàng sau <strong>{countdown}s</strong>
        </p>

        {/* ── Buttons ── */}
        <div className="osm-actions">
          <button className="osm-btn osm-btn--primary" onClick={handleViewOrder}>
            Xem đơn hàng
          </button>
          <button className="osm-btn osm-btn--secondary" onClick={handleContinue}>
            Tiếp tục mua sắm
          </button>
        </div>

      </div>
    </div>
  )
}