package com.greenjuicehub.backend.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ghn")
@Getter
@Setter
public class GhnProperties {
    // ── Dùng cho TÍNH PHÍ SHIP (luôn production — hiển thị phí đúng cho khách) ──
    private String token;
    private Integer shopId;
    private String baseUrl;
    private Integer fromDistrictId;
    private String fromWardCode;
    private Integer serviceTypeId = 2;
    // ── Bảo mật webhook ──
    private String webhookToken;
}