package com.greenjuicehub.backend.dto.product.request;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter @Setter
public class ProductFilterRequest {
    private Long categoryId;
    private Long flavorId;
    private Long sizeId;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Double minRating;
    private Double minDiscount;
    private Boolean inStock;
    private Boolean onSale;
    private String keyword;
    private String sortBy; // price_asc, price_desc, newest, bestseller, rating, discount
    private Integer page = 0;
    private Integer size = 12;
}