package com.greenjuicehub.backend.dto.adminPromotion.request;

import com.greenjuicehub.backend.entity.Promotion;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class SavePromotionRequest {

    @NotBlank(message = "Mã khuyến mãi không được để trống")
    @Size(max = 50, message = "Mã khuyến mãi tối đa 50 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Mã chỉ gồm chữ, số, gạch dưới hoặc gạch ngang")
    private String code;

    @NotBlank(message = "Tên chương trình không được để trống")
    private String name;

    @NotNull(message = "Loại giảm giá không được để trống")
    private Promotion.PromotionType type;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải > 0")
    private BigDecimal value;

    @DecimalMin(value = "0", message = "Giá trị đơn tối thiểu phải >= 0")
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    private Boolean freeShipping = false;

    @NotNull(message = "Đối tượng áp dụng không được để trống")
    private Promotion.Target target;

    // Bắt buộc nếu target = PERSONAL
    private Long userId;

    // null = không giới hạn tổng lượt dùng
    @Min(value = 1, message = "Tổng lượt dùng phải >= 1 (để trống nếu không giới hạn)")
    private Integer maxUses;

    @Min(value = 1, message = "Lượt dùng mỗi user phải >= 1")
    private Integer maxUsesPerUser;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startsAt;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endsAt;

    private Boolean isActive = true;
}