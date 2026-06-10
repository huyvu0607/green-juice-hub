package com.greenjuicehub.backend.service.sepay;

import com.greenjuicehub.backend.dto.sepay.request.SePayWebhookRequest;

public interface ISePayWebhookService {
    void handlePayment(SePayWebhookRequest request);
}