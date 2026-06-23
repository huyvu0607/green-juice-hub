package com.greenjuicehub.backend.service.payment;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

public interface IVnpayService {

    /**
     * Tạo URL thanh toán VNPay cho một đơn hàng.
     *
     * @param orderId  ID đơn hàng trong DB
     * @param clientIp IP của user (lấy từ HttpServletRequest)
     * @return URL redirect sang cổng VNPay
     */
    String createPaymentUrl(Long orderId, String clientIp);

    /**
     * Xử lý IPN (server-to-server) từ VNPay — cập nhật DB.
     *
     * @param params toàn bộ query params từ VNPay IPN request
     * @return mã kết quả: "00" = OK, khác = lỗi
     */
    String processIpn(Map<String, String> params);

    /**
     * Xử lý return URL (browser redirect) — chỉ verify chữ ký, KHÔNG cập nhật DB.
     *
     * @param params toàn bộ query params từ VNPay return request
     * @return map chứa success, orderCode, message để FE hiển thị
     */
    Map<String, Object> processReturn(Map<String, String> params);

    /**
     * Lấy IP thật của client, xử lý cả trường hợp qua proxy/load balancer.
     */
    String getClientIp(HttpServletRequest request);
}