package com.greenjuicehub.backend.dto.adminProduct.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class SaveVariantRequest {

    private Long flavorId;
    private Long sizeId;

    @NotNull(message = "Giá gốc không được để trống")
    @DecimalMin(value = "0", message = "Giá gốc phải >= 0")
    private BigDecimal originalPrice;

    @NotNull(message = "Giá sale không được để trống")
    @DecimalMin(value = "0", message = "Giá sale phải >= 0")
    private BigDecimal salePrice;

    @NotNull(message = "Tồn kho không được để trống")
    @Min(value = 0, message = "Tồn kho phải >= 0")
    private Integer stockQty;

    @Min(value = 1, message = "Trọng lượng phải >= 1g")
    private Integer weightGram = 500;

    private Integer sortOrder = 0;
    private Boolean isActive = true;
}