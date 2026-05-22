package com.greenjuicehub.backend.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class VerifyOtpRequest {

    @NotBlank
    private String phone;

    @NotBlank
    private String otpCode;

    @NotBlank(message = "Type không được để trống")
    @Pattern(regexp = "REGISTER|LOGIN|RESET_PASSWORD", message = "Type không hợp lệ")
    private String type;
}