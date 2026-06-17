package com.greenjuicehub.backend.dto.adminUser.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {

    @NotNull(message = "Role không được để trống")
    private String role; // CUSTOMER / STAFF / ADMIN
}