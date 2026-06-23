package com.greenjuicehub.backend.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "vnpay")
public class VnpayProperties {

    /** TMN Code nhận từ VNPay — vnp_TmnCode */
    private String tmnCode;

    /** Hash Secret để ký HMAC-SHA512 */
    private String hashSecret;

    /** URL cổng thanh toán sandbox/production */
    private String payUrl;

    /**
     * Return URL: VNPay redirect browser về đây sau khi thanh toán.
     * Đây là URL của FRONTEND (Vercel) để hiện trang kết quả cho user.
     * VD: https://greenjuicehub.vercel.app/payment/vnpay/result
     */
    private String returnUrl;

    /**
     * IPN URL: VNPay gọi server-to-server để xác nhận thanh toán.
     * Đây là URL của BACKEND (Railway) — phải public, không cần auth.
     * VD: https://your-be.railway.app/api/payment/vnpay/ipn
     */
    private String ipnUrl;
}