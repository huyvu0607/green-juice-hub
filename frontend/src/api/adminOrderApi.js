import api from './axiosConfig'

const adminOrderApi = {
  /**
   * Danh sách đơn hàng — lọc status + paymentStatus, tìm orderCode, phân trang
   * @param {object} params   - { page, size, status?, paymentStatus?, search? }
   * @param {object} config   - axios config thêm (vd: { signal } để abort)
   */
  getOrders: (params = {}, config = {}) =>
    api.get('/admin/orders', { params, ...config }),

  /** Số đơn theo từng trạng thái + trạng thái thanh toán — dùng cho tab badge */
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

  getOrderCountsByMonth: (year, month) =>
    api.get('/admin/orders/counts-by-date', { params: { year, month } }),
}

export default adminOrderApi