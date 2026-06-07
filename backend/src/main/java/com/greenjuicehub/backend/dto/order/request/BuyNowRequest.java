package com.greenjuicehub.backend.dto.order.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BuyNowRequest {

    /** ID variant muốn mua */
    @NotNull(message = "Vui lòng chọn sản phẩm")
    private Long variantId;

    /** Số lượng */
    @NotNull(message = "Vui lòng nhập số lượng")
    @Min(value = 1, message = "Số lượng tối thiểu là 1")
    private Integer quantity;

    /** ID địa chỉ giao hàng */
    @NotNull(message = "Vui lòng chọn địa chỉ giao hàng")
    private Long addressId;

    /** Phương thức thanh toán: COD | VNPAY | MOMO | BANK_TRANSFER */
    @NotNull(message = "Vui lòng chọn phương thức thanh toán")
    private String paymentMethod;

    /** Mã khuyến mãi (nullable) */
    private String promoCode;

    /** Ghi chú (nullable) */
    private String note;
}