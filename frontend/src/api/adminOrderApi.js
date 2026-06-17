import api from './axiosConfig'

const adminOrderApi = {
  /**
   * Danh sách đơn hàng — lọc status + paymentStatus, tìm orderCode, phân trang
   * @param {object} params   - { page, size, status?, paymentStatus?, search?, dateFrom?, dateTo? }
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

  /** Đếm số đơn theo ngày trong tháng — dùng cho mini calendar */
  getOrderCountsByMonth: (year, month) =>
    api.get('/admin/orders/counts-by-date', { params: { year, month } }),

  /**
   * Đếm số đơn 7 ngày gần nhất — dùng cho mini bar chart
   * Trả về: { "2026-06-10": 4, "2026-06-11": 7, ... }
   */
  getWeeklyOrderCounts: () =>
    api.get('/admin/orders/weekly-counts'),

  /**
   * Top sản phẩm bán chạy trong 30 ngày gần nhất
   * @param {object} params - { limit? } (mặc định 5)
   * Trả về: [{ productId, name, totalSold }, ...]
   */
  getTopProducts: (params = { limit: 5 }) =>
    api.get('/admin/orders/top-products', { params }),
}

export default adminOrderApi