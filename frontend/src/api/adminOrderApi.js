import api from './axiosConfig'

const adminOrderApi = {
  /** Danh sách đơn hàng — lọc status, tìm orderCode, phân trang */
  getOrders: (params = {}) =>
    api.get('/admin/orders', { params }),

  /** Số đơn theo từng trạng thái — dùng cho tab badge */
  getStatusCounts: () =>
    api.get('/admin/orders/status-counts'),

  /** Chi tiết 1 đơn hàng */
  getOrderDetail: (orderId) =>
    api.get(`/admin/orders/${orderId}`),

  /** Cập nhật trạng thái đơn hàng */
  updateStatus: (orderId, status, cancelReason = null) =>
    api.patch(`/admin/orders/${orderId}/status`, { status, cancelReason }),

  /** Xử lý hoàn tiền */
  refund: (orderId, note = '') =>
    api.patch(`/admin/orders/${orderId}/refund`, { note }),
}

export default adminOrderApi