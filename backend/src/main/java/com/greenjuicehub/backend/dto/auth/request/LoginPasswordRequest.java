package com.greenjuicehub.backend.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginPasswordRequest {

    @NotBlank
    private String phone;

    @NotBlank
    private String password;
}