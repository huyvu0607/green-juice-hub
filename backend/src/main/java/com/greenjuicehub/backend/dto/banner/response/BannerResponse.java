package com.greenjuicehub.backend.dto.banner.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BannerResponse {
    private Long id;
    private String title;
    private String imageUrl;
    private String description;
    private String linkUrl;
    private Integer sortOrder;
    private Boolean isActive;
}