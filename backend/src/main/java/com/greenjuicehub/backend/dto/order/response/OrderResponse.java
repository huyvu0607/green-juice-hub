package com.greenjuicehub.backend.dto.order.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;
    private String orderCode;
    private String status;           // PENDING | CONFIRMED | SHIPPING | DELIVERED | CANCELLED
    private String paymentStatus;    // PENDING | PAID | REFUNDED
    private String paymentMethod;    // COD | VNPAY | MOMO | BANK_TRANSFER

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private String promoCode;        // nullable
    private String note;

    private ShippingAddressResponse shippingAddress;
    private List<OrderItemResponse> items;

    private String cancelReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}