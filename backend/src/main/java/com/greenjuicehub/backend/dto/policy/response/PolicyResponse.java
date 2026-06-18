package com.greenjuicehub.backend.dto.policy.response;

import com.greenjuicehub.backend.entity.ShippingPolicy.PolicyType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PolicyResponse {
    private Long id;
    private PolicyType type;
    private String title;
    private String content;
    private Integer sortOrder;
    private Boolean isActive;       // ← thêm để admin biết trạng thái
    private LocalDateTime updatedAt;
}