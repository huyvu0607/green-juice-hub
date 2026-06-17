package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.config.properties.SePayProperties;
import com.greenjuicehub.backend.dto.sepay.request.SePayWebhookRequest;
import com.greenjuicehub.backend.service.sepay.ISePayWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final SePayProperties sePayProperties;
    private final ISePayWebhookService sePayWebhookService;

    @PostMapping("/sepay")
    public ResponseEntity<?> handleSePay(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SePayWebhookRequest request
    ) {
        // 1. Xác thực API key
        String expectedToken = "apikey " + sePayProperties.getApiKey();
        if (authHeader == null || !authHeader.equalsIgnoreCase(expectedToken)) {
            log.warn("SePay webhook: unauthorized - authHeader={}", authHeader);
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        // 2. Xử lý
        sePayWebhookService.handlePayment(request);

        // 3. Luôn trả 200 để SePay không retry
        return ResponseEntity.ok(Map.of("message", "OK"));
    }
}