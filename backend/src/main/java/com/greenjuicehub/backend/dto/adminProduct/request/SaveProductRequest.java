package com.greenjuicehub.backend.dto.adminProduct.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class SaveProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private String description;

    // null = giữ nguyên ảnh cũ (khi update), empty list = xoá hết
    private List<ProductImageRequest> images;

    private List<String> tags;

    @Getter
    @NoArgsConstructor
    public static class ProductImageRequest {
        @NotBlank
        private String imageUrl;
        private Boolean isPrimary = false;
        private Integer sortOrder = 0;
    }
}