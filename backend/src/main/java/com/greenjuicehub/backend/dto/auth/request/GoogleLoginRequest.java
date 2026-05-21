package com.greenjuicehub.backend.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class GoogleLoginRequest {

    @NotBlank
    private String idToken; // Token từ Google trả về FE
}