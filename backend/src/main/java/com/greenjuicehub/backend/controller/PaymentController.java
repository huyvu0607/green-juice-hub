package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.service.payment.IVnpayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final IVnpayService vnpayService;

    // ─────────────────────────────────────────────────────────────────────────
    // VNPAY — TẠO URL THANH TOÁN
    // POST /api/payment/vnpay/create-url
    // Body: { "orderId": 123 }
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/vnpay/create-url")
    public ResponseEntity<?> createVnpayUrl(
            @RequestBody Map<String, Long> body,
            HttpServletRequest request
    ) {
        Long orderId  = body.get("orderId");
        String clientIp = vnpayService.getClientIp(request);
        String paymentUrl = vnpayService.createPaymentUrl(orderId, clientIp);

        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VNPAY — IPN (server-to-server từ VNPay, không cần auth)
    // GET /api/payment/vnpay/ipn?vnp_TxnRef=...&vnp_SecureHash=...&...
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/vnpay/ipn")
    public ResponseEntity<?> vnpayIpn(@RequestParam Map<String, String> params) {
        String resultCode = vnpayService.processIpn(params);
        // VNPay yêu cầu trả về JSON { "RspCode": "00", "Message": "Confirm Success" }
        return ResponseEntity.ok(Map.of(
                "RspCode", resultCode,
                "Message", "00".equals(resultCode) ? "Confirm Success" : "Confirm Fail"
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VNPAY — RETURN URL (browser redirect sau khi thanh toán)
    // GET /api/payment/vnpay/return?vnp_TxnRef=...&vnp_ResponseCode=...&...
    //
    // NOTE: Endpoint này không redirect trực tiếp vì FE ở Vercel (khác domain).
    // FE sẽ tự gọi endpoint này từ trang /payment/vnpay/result để verify kết quả.
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/vnpay/return")
    public ResponseEntity<?> vnpayReturn(@RequestParam Map<String, String> params) {
        Map<String, Object> result = vnpayService.processReturn(params);
        return ResponseEntity.ok(result);
    }
}