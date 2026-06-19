package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.banner.response.BannerResponse;
import com.greenjuicehub.backend.entity.Banner;
import org.springframework.stereotype.Component;

@Component
public class BannerMapper {

    public BannerResponse toResponse(Banner banner) {
        return BannerResponse.builder()
                .id(banner.getId())
                .title(banner.getTitle())
                .description(banner.getDescription())
                .imageUrl(banner.getImageUrl())
                .linkUrl(banner.getLinkUrl())
                .sortOrder(banner.getSortOrder())
                .isActive(banner.getIsActive())
                .build();
    }
}