package com.greenjuicehub.backend.dto.adminProduct.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SaveFlavorRequest {

    @NotBlank(message = "Tên hương vị không được để trống")
    private String name;

    private Boolean isActive = true;
}