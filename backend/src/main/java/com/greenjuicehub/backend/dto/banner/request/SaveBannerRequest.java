package com.greenjuicehub.backend.dto.banner.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SaveBannerRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    @NotBlank(message = "URL ảnh không được để trống")
    @Size(max = 500, message = "URL ảnh tối đa 500 ký tự")
    private String imageUrl;

    @Size(max = 500, message = "URL liên kết tối đa 500 ký tự")
    private String linkUrl;

    @NotNull(message = "Thứ tự không được để trống")
    private Integer sortOrder;

    @NotNull(message = "Trạng thái không được để trống")
    private Boolean isActive;
}