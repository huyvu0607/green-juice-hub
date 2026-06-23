package com.greenjuicehub.backend.service.payment.impl;

import com.greenjuicehub.backend.config.properties.VnpayProperties;
import com.greenjuicehub.backend.entity.Order;
import com.greenjuicehub.backend.entity.Payment;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.OrderRepository;
import com.greenjuicehub.backend.repository.PaymentRepository;
import com.greenjuicehub.backend.service.payment.IVnpayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VnpayServiceImpl implements IVnpayService {

    private final VnpayProperties vnpayProperties;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // TẠO PAYMENT URL
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public String createPaymentUrl(Long orderId, String clientIp) {
        // 1. Lấy order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));

        // 2. Kiểm tra trạng thái
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Đơn hàng đã được thanh toán");
        }
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Đơn hàng đã bị huỷ");
        }

        // 3. Kiểm tra payment method
        Payment payment = paymentRepository
                .findTopByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin thanh toán"));

        if (payment.getMethod() != Payment.PaymentMethod.VNPAY) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Đơn hàng này không dùng phương thức VNPay");
        }

        // 4. Build params — TreeMap tự sort key theo alphabet (yêu cầu của VNPay)
        String vnpTxnRef    = order.getOrderCode();
        long   vnpAmount    = order.getTotalAmount()
                .multiply(BigDecimal.valueOf(100)) // VNPay nhân 100
                .longValue();
        String vnpCreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String vnpExpireDate = new SimpleDateFormat("yyyyMMddHHmmss")
                .format(new Date(System.currentTimeMillis() + 15 * 60 * 1000L)); // +15 phút

        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version",    "2.1.0");
        vnpParams.put("vnp_Command",    "pay");
        vnpParams.put("vnp_TmnCode",    vnpayProperties.getTmnCode());
        vnpParams.put("vnp_Amount",     String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode",   "VND");
        vnpParams.put("vnp_TxnRef",     vnpTxnRef);
        vnpParams.put("vnp_OrderInfo",  "Thanh toan don hang " + vnpTxnRef);
        vnpParams.put("vnp_OrderType",  "other");
        vnpParams.put("vnp_Locale",     "vn");
        vnpParams.put("vnp_ReturnUrl",  vnpayProperties.getReturnUrl());
        vnpParams.put("vnp_IpAddr",     clientIp);
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        // 5. Build query string để ký
        StringBuilder hashData    = new StringBuilder();
        StringBuilder queryString = new StringBuilder();

        for (Map.Entry<String, String> entry : vnpParams.entrySet()) {
            String encodedKey   = URLEncoder.encode(entry.getKey(),   StandardCharsets.US_ASCII);
            String encodedValue = URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII);

            hashData.append(encodedKey).append('=').append(encodedValue).append('&');
            queryString.append(encodedKey).append('=').append(encodedValue).append('&');
        }
        // Xoá dấu & cuối
        hashData.deleteCharAt(hashData.length() - 1);
        queryString.deleteCharAt(queryString.length() - 1);

        // 6. Ký HMAC-SHA512
        String secureHash = hmacSHA512(vnpayProperties.getHashSecret(), hashData.toString());

        // 7. Ghép URL hoàn chỉnh
        String paymentUrl = vnpayProperties.getPayUrl()
                + "?" + queryString
                + "&vnp_SecureHash=" + secureHash;

        log.info("[VNPay] Tạo payment URL - orderCode={}, amount={}", vnpTxnRef, vnpAmount);
        return paymentUrl;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // XỬ LÝ IPN (server-to-server từ VNPay)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public String processIpn(Map<String, String> params) {
        // 1. Lấy secure hash VNPay gửi
        String vnpSecureHash = params.get("vnp_SecureHash");

        // 2. Tạo lại hash từ params (bỏ vnp_SecureHash ra)
        Map<String, String> signParams = new TreeMap<>(params);
        signParams.remove("vnp_SecureHash");
        signParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : signParams.entrySet()) {
            hashData.append(URLEncoder.encode(entry.getKey(),   StandardCharsets.US_ASCII))
                    .append('=')
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                    .append('&');
        }
        if (!hashData.isEmpty()) {
            hashData.deleteCharAt(hashData.length() - 1);
        }

        String calculatedHash = hmacSHA512(vnpayProperties.getHashSecret(), hashData.toString());

        // 3. So sánh hash — nếu sai → có thể bị giả mạo
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            log.warn("[VNPay IPN] Chữ ký không khớp — có thể bị giả mạo");
            return "97"; // Invalid signature
        }

        // 4. Lấy thông tin từ params
        String orderCode    = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionId = params.get("vnp_TransactionNo");
        String vnpAmountStr = params.get("vnp_Amount");

        // 5. Tìm order
        Order order = orderRepository.findByOrderCode(orderCode).orElse(null);
        if (order == null) {
            log.warn("[VNPay IPN] Không tìm thấy đơn hàng - orderCode={}", orderCode);
            return "01"; // Order not found
        }

        // 6. Idempotent — đã xử lý rồi thì bỏ qua
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            log.info("[VNPay IPN] Đơn {} đã thanh toán trước đó, bỏ qua", orderCode);
            return "00";
        }

        // 7. Kiểm tra số tiền
        long expectedAmount = order.getTotalAmount()
                .multiply(BigDecimal.valueOf(100))
                .longValue();
        long receivedAmount = Long.parseLong(vnpAmountStr);

        if (receivedAmount != expectedAmount) {
            log.warn("[VNPay IPN] Số tiền không khớp - expected={} received={}", expectedAmount, receivedAmount);
            return "04"; // Invalid amount
        }

        // 8. Lấy payment record
        Payment payment = paymentRepository
                .findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                .orElse(null);
        if (payment == null) {
            log.error("[VNPay IPN] Không tìm thấy payment record - orderCode={}", orderCode);
            return "01";
        }

        // 9. Cập nhật theo kết quả
        if ("00".equals(responseCode)) {
            // ✅ Thành công
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            payment.setTransactionId(transactionId);
            payment.setPaidAt(LocalDateTime.now());
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            log.info("[VNPay IPN] Thanh toán thành công - orderCode={}, txnId={}", orderCode, transactionId);
        } else {
            // ❌ Thất bại
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setNote("VNPay responseCode=" + responseCode);
            log.warn("[VNPay IPN] Thanh toán thất bại - orderCode={}, responseCode={}", orderCode, responseCode);
        }

        paymentRepository.save(payment);
        orderRepository.save(order);

        return "00"; // Luôn trả 00 để VNPay biết đã nhận được
    }

    // ─────────────────────────────────────────────────────────────────────────
    // XỬ LÝ RETURN URL (browser redirect)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Map<String, Object> processReturn(Map<String, String> params) {
        String vnpSecureHash = params.get("vnp_SecureHash");

        Map<String, String> signParams = new TreeMap<>(params);
        signParams.remove("vnp_SecureHash");
        signParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : signParams.entrySet()) {
            hashData.append(URLEncoder.encode(entry.getKey(),   StandardCharsets.US_ASCII))
                    .append('=')
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                    .append('&');
        }
        if (!hashData.isEmpty()) {
            hashData.deleteCharAt(hashData.length() - 1);
        }

        String  calculatedHash = hmacSHA512(vnpayProperties.getHashSecret(), hashData.toString());
        boolean isValid        = calculatedHash.equalsIgnoreCase(vnpSecureHash);
        String  responseCode   = params.get("vnp_ResponseCode");
        String  orderCode      = params.get("vnp_TxnRef");
        String  transactionId  = params.get("vnp_TransactionNo");
        boolean isSuccess      = isValid && "00".equals(responseCode);

        // ── Update DB nếu thành công ─────────────────────────────────────────
        Order order = orderRepository.findByOrderCode(orderCode).orElse(null);

        if (isSuccess && order != null
                && order.getPaymentStatus() != Order.PaymentStatus.PAID) {

            order.setPaymentStatus(Order.PaymentStatus.PAID);
            orderRepository.save(order);

            paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                    .ifPresent(payment -> {
                        payment.setStatus(Payment.PaymentStatus.SUCCESS);
                        payment.setTransactionId(transactionId);
                        payment.setPaidAt(LocalDateTime.now());
                        paymentRepository.save(payment);
                    });

            log.info("[VNPay Return] Cập nhật PAID - orderCode={}", orderCode);
        }

        // ── Trả về FE ────────────────────────────────────────────────────────
        Map<String, Object> result = new HashMap<>();
        result.put("success",      isSuccess);
        result.put("orderCode",    orderCode);
        result.put("orderId",      order != null ? order.getId() : null); // FE dùng redirect
        result.put("responseCode", responseCode);
        result.put("message",      isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại hoặc bị huỷ");

        log.info("[VNPay Return] orderCode={} success={} responseCode={}", orderCode, isSuccess, responseCode);
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET CLIENT IP
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For có thể chứa nhiều IP — lấy cái đầu tiên
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "127.0.0.1";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER: HMAC-SHA512
    // ─────────────────────────────────────────────────────────────────────────

    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo HMAC-SHA512", e);
        }
    }
}