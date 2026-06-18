package com.greenjuicehub.backend.service.banner.impl;

import com.greenjuicehub.backend.dto.banner.request.SaveBannerRequest;
import com.greenjuicehub.backend.dto.banner.response.BannerResponse;
import com.greenjuicehub.backend.entity.Banner;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.BannerMapper;
import com.greenjuicehub.backend.repository.BannerRepository;
import com.greenjuicehub.backend.service.banner.IBannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements IBannerService {

    private final BannerRepository bannerRepository;
    private final BannerMapper bannerMapper;

    // ── Public ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(bannerMapper::toResponse)
                .toList();
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getAllBanners() {
        return bannerRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(bannerMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public BannerResponse createBanner(SaveBannerRequest request) {
        Banner banner = Banner.builder()
                .title(request.getTitle())
                .imageUrl(request.getImageUrl())
                .linkUrl(request.getLinkUrl())
                .sortOrder(request.getSortOrder())
                .isActive(request.getIsActive())
                .build();

        bannerRepository.save(banner);
        return bannerMapper.toResponse(banner);
    }

    @Override
    @Transactional
    public BannerResponse updateBanner(Long id, SaveBannerRequest request) {
        Banner banner = findOrThrow(id);

        banner.setTitle(request.getTitle());
        banner.setImageUrl(request.getImageUrl());
        banner.setLinkUrl(request.getLinkUrl());
        banner.setSortOrder(request.getSortOrder());
        banner.setIsActive(request.getIsActive());

        bannerRepository.save(banner);
        return bannerMapper.toResponse(banner);
    }

    @Override
    @Transactional
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Banner không tồn tại");
        }
        bannerRepository.deleteById(id);
    }

    @Override
    @Transactional
    public BannerResponse toggleActive(Long id) {
        Banner banner = findOrThrow(id);
        banner.setIsActive(!banner.getIsActive());
        bannerRepository.save(banner);
        return bannerMapper.toResponse(banner);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Banner findOrThrow(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Banner không tồn tại"));
    }
}