package com.greenjuicehub.backend.dto.auth.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OtpResponse {
    private boolean success;
    private String message;
    private boolean isNewUser;   // FE dùng để hiện form "Tạo mật khẩu không?"
    private boolean hasPassword; // FE dùng để hiện form chọn OTP hay mật khẩu
    private String tempToken; //Dùng để verify người dùng
}