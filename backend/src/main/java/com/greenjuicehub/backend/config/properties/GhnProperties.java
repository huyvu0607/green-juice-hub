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
    // ── Dùng cho TẠO ĐƠN GHN (có thể staging khi test, production khi live) ──
    private String orderBaseUrl;   // vd: https://dev-online-gateway.ghn.vn (test) hoặc https://online-gateway.ghn.vn (live)
    private String orderToken;     // token staging hoặc production riêng cho tạo đơn
    private Integer orderShopId;   // shop ID staging hoặc production riêng cho tạo đơn

    // ── Bảo mật webhook ──
    private String webhookToken;
}