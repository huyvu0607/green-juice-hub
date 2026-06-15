package com.greenjuicehub.backend.dto.adminProduct.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SaveCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    private String description;
    private String imageUrl;
    private Integer sortOrder = 0;
    private Boolean isActive = true;
}