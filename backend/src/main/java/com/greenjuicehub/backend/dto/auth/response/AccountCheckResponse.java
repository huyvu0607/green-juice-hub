package com.greenjuicehub.backend.dto.auth.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountCheckResponse {
    private boolean exists;
    private boolean isNewUser;
    private boolean hasPassword;
}
