package com.greenjuicehub.backend.dto.order.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplyPromoRequest {

    @NotBlank(message = "Mã khuyến mãi không được để trống")
    private String promoCode;

    // Cart checkout — null nếu là buyNow
    private List<Long> cartItemIds;

    // BuyNow — null nếu là cart
    private Long variantId;
    private Integer quantity;
}