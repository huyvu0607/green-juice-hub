package com.greenjuicehub.backend.dto.adminUser.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreatePersonalPromoRequest {

    @NotBlank(message = "Mã khuyến mãi không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên chương trình không được để trống")
    private String name;

    /** PERCENT hoặc FIXED */
    @NotNull
    private String type;

    @NotNull
    @DecimalMin("0")
    private BigDecimal value;

    @DecimalMin("0")
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    private Boolean freeShipping = false;

    private Integer maxUsesPerUser = 1;

    @NotNull
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startsAt;

    @NotNull
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endsAt;
}