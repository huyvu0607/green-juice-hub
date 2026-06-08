import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './OrderSuccessModal.css'

export default function OrderSuccessModal({ order, onClose }) {
  const navigate = useNavigate()

  // Khoá scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleViewOrder = () => {
    onClose?.()
    navigate(`/orders/${order?.id}`, { state: { fromCheckout: true } })
  }

  const handleContinue = () => {
    onClose?.()
    navigate('/products')
  }

  return (
    <div className="osm-backdrop" onClick={onClose}>
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