package com.greenjuicehub.backend.dto.order.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PlaceOrderRequest {

    /** Danh sách cartItemId user đã chọn từ giỏ hàng */
    @NotEmpty(message = "Phải chọn ít nhất 1 sản phẩm")
    private List<Long> cartItemIds;

    /** ID địa chỉ giao hàng đã lưu */
    @NotNull(message = "Vui lòng chọn địa chỉ giao hàng")
    private Long addressId;

    /** Phương thức thanh toán: COD | VNPAY | MOMO | BANK_TRANSFER */
    @NotNull(message = "Vui lòng chọn phương thức thanh toán")
    private String paymentMethod;

    /** Mã khuyến mãi (nullable) */
    private String promoCode;

    /** Ghi chú đơn hàng (nullable) */
    private String note;
}