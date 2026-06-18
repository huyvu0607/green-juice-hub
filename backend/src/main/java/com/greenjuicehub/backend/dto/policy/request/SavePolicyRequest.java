package com.greenjuicehub.backend.dto.policy.request;

import com.greenjuicehub.backend.entity.ShippingPolicy.PolicyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SavePolicyRequest {

    @NotNull(message = "Loại chính sách không được để trống")
    private PolicyType type;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    private String content;

    private Integer sortOrder = 0;

    private Boolean isActive = true;
}