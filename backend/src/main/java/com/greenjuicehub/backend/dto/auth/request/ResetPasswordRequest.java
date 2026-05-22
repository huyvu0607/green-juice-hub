package com.greenjuicehub.backend.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Phiên xác thực không hợp lệ")
    private String tempToken;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới")
    @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
    private String newPassword;
}