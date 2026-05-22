package com.greenjuicehub.backend.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginPasswordRequest {

    @NotBlank(message = "Vui lòng nhập số điện thoại, email hoặc tên đăng nhập")
    private String identifier;

    @NotBlank(message = "Vui lòng nhập mật khẩu")
    private String password;

    private String captchaToken;
}