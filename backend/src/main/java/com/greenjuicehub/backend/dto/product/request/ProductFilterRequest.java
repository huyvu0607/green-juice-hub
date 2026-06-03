package com.greenjuicehub.backend.dto.product.request;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
public class ProductFilterRequest {
    private Long categoryId;

    // Đổi từ số ít → số nhiều để nhận list
    private List<Long> flavorIds;
    private List<Long> sizeIds;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Double minRating;
    private Double minDiscount;
    private Boolean inStock;
    private Boolean onSale;
    private String keyword;
    private String tags;  // thêm mới — nhận "bestseller,organic"
    private String sortBy;
    private Integer page = 0;
    private Integer size = 12;
}