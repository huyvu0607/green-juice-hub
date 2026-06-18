package com.greenjuicehub.backend.service.banner;

import com.greenjuicehub.backend.dto.banner.request.SaveBannerRequest;
import com.greenjuicehub.backend.dto.banner.response.BannerResponse;

import java.util.List;

public interface IBannerService {

    /** Lấy danh sách banner active (public — dùng ở homepage) */
    List<BannerResponse> getActiveBanners();

    /** Lấy tất cả banner (admin) */
    List<BannerResponse> getAllBanners();

    /** Tạo banner mới */
    BannerResponse createBanner(SaveBannerRequest request);

    /** Cập nhật banner */
    BannerResponse updateBanner(Long id, SaveBannerRequest request);

    /** Xoá banner */
    void deleteBanner(Long id);

    /** Toggle active */
    BannerResponse toggleActive(Long id);
}