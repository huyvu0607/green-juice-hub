import api from './axiosConfig'

const paymentApi = {
  /**
   * Tạo URL thanh toán VNPay.
   * BE sẽ ký HMAC-SHA512 và trả về { paymentUrl }.
   */
  createVnpayUrl: (orderId) =>
    api.post('/payment/vnpay/create-url', { orderId }),

  /**
   * Verify kết quả sau khi VNPay redirect về FE.
   * FE gọi endpoint này với toàn bộ query params mà VNPay đính kèm vào return URL.
   * BE verify chữ ký và trả về { success, orderCode, message }.
   *
   * @param {URLSearchParams | Record<string, string>} params - query params từ URL hiện tại
   */
  verifyVnpayReturn: (params) =>
    api.get('/payment/vnpay/return', { params }),
}

export default paymentApi