package com.greenjuicehub.backend.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SetPasswordRequest {

    @NotBlank
    private String phone;

    @NotBlank
    @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
    private String password;
}