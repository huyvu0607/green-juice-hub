import api from './axiosConfig'

const orderApi = {
  /** Đặt hàng */
  placeOrder: (data) =>
    api.post('/orders', data),

  /** Danh sách đơn hàng (có phân trang) */
  getMyOrders: (page = 0, size = 10, status = null) =>
    api.get(`/orders`, { params: { page, size, ...(status && { status }) } }),

  /** Chi tiết đơn hàng */
  getOrderDetail: (orderId) =>
    api.get(`/orders/${orderId}`),

  /** Mua ngay — không qua giỏ hàng */
  buyNow: (data) =>
    api.post('/orders/buy-now', data),

  /** Huỷ đơn */
  cancelOrder: (orderId) =>
    api.patch(`/orders/${orderId}/cancel`),

  /** Kiểm tra mã khuyến mãi */
  applyPromo: (promoCode, payload) =>
    api.post('/orders/apply-promo', { promoCode, ...payload }),

  // Thống kê số lượng đơn theo trạng thái (để show badge ở OrdersListPage)
  getStatusCounts: () =>
    api.get('/orders/status-counts'),

  // Lấy danh sách mã khuyến mãi có thể áp dụng cho giỏ hàng hiện tại
  getAvailablePromos: (payload) =>
  api.post('/promos/available', payload),
}

export default orderApi