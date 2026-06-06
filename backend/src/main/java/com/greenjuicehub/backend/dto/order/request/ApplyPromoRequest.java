package com.greenjuicehub.backend.dto.order.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplyPromoRequest {

    @NotBlank(message = "Mã khuyến mãi không được để trống")
    private String promoCode;

    /** cartItemId đã chọn để tính subtotal */
    @NotEmpty(message = "Phải chọn ít nhất 1 sản phẩm")
    private List<Long> cartItemIds;
}