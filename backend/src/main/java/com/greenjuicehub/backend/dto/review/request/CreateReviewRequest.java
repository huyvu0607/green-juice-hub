package com.greenjuicehub.backend.dto.review.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateReviewRequest {

    @NotNull(message = "Vui lòng chọn sản phẩm")
    private Long productId;

    @NotNull(message = "Vui lòng chọn đơn hàng")
    private Long orderId;

    @NotNull(message = "Vui lòng chọn số sao")
    @Min(value = 1, message = "Rating tối thiểu là 1 sao")
    @Max(value = 5, message = "Rating tối đa là 5 sao")
    private Byte rating;

    private String comment;

    private String imageUrl;
}