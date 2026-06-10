package com.greenjuicehub.backend.dto.sepay.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter @Setter
public class SePayWebhookRequest {
    private Long id;
    private String gateway;
    private String transactionDate;
    private String accountNumber;
    private String subAccount;
    private String transferType;
    private BigDecimal transferAmount;
    private BigDecimal accumulated;
    private String code;
    private String content;
    private String referenceCode;
    private String description;
}