import api from './axiosConfig'

const orderApi = {
  /** Đặt hàng */
  placeOrder: (data) =>
    api.post('/orders', data),

  /** Danh sách đơn hàng (có phân trang) */
  getMyOrders: (page = 0, size = 10) =>
    api.get('/orders', { params: { page, size } }),

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
  applyPromo: (promoCode, cartItemIds) =>
    api.post('/orders/apply-promo', { promoCode, cartItemIds }),
}

export default orderApi