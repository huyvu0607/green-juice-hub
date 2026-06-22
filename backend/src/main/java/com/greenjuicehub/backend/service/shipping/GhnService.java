package com.greenjuicehub.backend.service.shipping;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenjuicehub.backend.config.properties.GhnProperties;
import com.greenjuicehub.backend.entity.Order;
import com.greenjuicehub.backend.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GhnService {

    private final GhnProperties ghn;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ── Headers ────────────────────────────────────────────────────
    private HttpHeaders baseHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("token", ghn.getToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private HttpHeaders shopHeaders() {
        HttpHeaders headers = baseHeaders();
        headers.set("ShopId", String.valueOf(ghn.getShopId()));
        return headers;
    }

    // ── Provinces ──────────────────────────────────────────────────
    public List<Map<String, Object>> getProvinces() {
        String url = ghn.getBaseUrl() + "/shiip/public-api/master-data/province";
        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    url, HttpMethod.GET,
                    new HttpEntity<>(baseHeaders()),
                    String.class
            );
            log.info("GHN provinces raw: {}", res.getBody());
            return parseList(res.getBody());
        } catch (Exception e) {
            log.error("GHN getProvinces error: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Districts ──────────────────────────────────────────────────
    public List<Map<String, Object>> getDistricts(Integer provinceId) {
        String url = ghn.getBaseUrl() + "/shiip/public-api/master-data/district";
        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(Map.of("province_id", provinceId), baseHeaders()),
                    String.class
            );
            return parseList(res.getBody());
        } catch (Exception e) {
            log.error("GHN getDistricts error: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Wards ──────────────────────────────────────────────────────
    public List<Map<String, Object>> getWards(Integer districtId) {
        String url = ghn.getBaseUrl() + "/shiip/public-api/master-data/ward";
        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(Map.of("district_id", districtId), baseHeaders()),
                    String.class
            );
            return parseList(res.getBody());
        } catch (Exception e) {
            log.error("GHN getWards error: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Tính phí ship ──────────────────────────────────────────────
    public BigDecimal calculateShippingFee(Integer toDistrictId,
                                           String toWardCode,
                                           int weightGram) {
        String url = ghn.getBaseUrl() + "/shiip/public-api/v2/shipping-order/fee";

        Map<String, Object> body = new HashMap<>();
        body.put("from_district_id", ghn.getFromDistrictId());
        body.put("from_ward_code",   ghn.getFromWardCode());
        body.put("to_district_id",   toDistrictId);
        body.put("to_ward_code",     toWardCode);
        body.put("weight",           Math.max(weightGram, 1));
        body.put("service_type_id",  ghn.getServiceTypeId());

        // ── Thêm log request ──
        log.info("GHN fee request: {}", body);

        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(body, shopHeaders()),
                    String.class
            );
            // ── Thêm log response ──
            log.info("GHN fee response: {}", res.getBody());

            JsonNode root = objectMapper.readTree(res.getBody());
            if (root.path("code").asInt() == 200) {
                int fee = root.path("data").path("total").asInt(30_000);
                return BigDecimal.valueOf(fee);
            }
            log.error("GHN fee error response: {}", res.getBody());
        } catch (Exception e) {
            log.error("GHN calculateShippingFee error: {}", e.getMessage());
        }
        return BigDecimal.valueOf(30_000);
    }

    // ── Tạo đơn vận chuyển GHN ────────────────────────────────────────────
    /**
     * Gọi GHN tạo đơn vận chuyển thật. Trả về ghn order_code nếu thành công,
     * null nếu thất bại (không throw để không chặn luồng confirm đơn —
     * admin vẫn confirm được, chỉ log lỗi để xử lý thủ công nếu cần).
     *
     * Kích thước gói hàng: dùng mặc định 1 đơn vị = 20x15x15cm, nhân height
     * theo tổng số lượng sản phẩm (stack theo chiều cao), cap ở 150cm (giới hạn GHN).
     * ProductVariant hiện chưa có field length/width/height — có thể cập nhật
     * chính xác hơn sau khi thêm các field đó vào entity.
     */
    public String createShippingOrder(Order order, String toName, String toPhone, String toAddress,
                                      String toWardCode, Integer toDistrictId,
                                      List<OrderItem> items, int weightGram) {
        if (toDistrictId == null || toWardCode == null || toWardCode.isBlank()) {
            log.error("GHN createShippingOrder: thiếu districtId/wardCode cho đơn {}, không thể tạo đơn GHN",
                    order.getOrderCode());
            return null;
        }

        String url = ghn.getBaseUrl() + "/shiip/public-api/v2/shipping-order/create";

        // Tính tổng số lượng sản phẩm để ước tính chiều cao gói hàng
        int totalQty = items.stream().mapToInt(OrderItem::getQuantity).sum();
        int length = 20; // cm — kích thước mặc định 1 đơn vị sản phẩm
        int width  = 15; // cm
        int height = Math.min(15 * Math.max(totalQty, 1), 150); // cap tối đa 150cm theo giới hạn GHN

        Map<String, Object> body = new HashMap<>();
        body.put("payment_type_id", 2); // 2 = shop trả phí ship, đổi thành 1 nếu thu hộ từ khách
        body.put("note", order.getNote() != null ? order.getNote() : "");
        body.put("required_note", "KHONGCHOXEMHANG");
        body.put("client_order_code", order.getOrderCode()); // map ngược lại đơn nội bộ

        body.put("to_name", toName);
        body.put("to_phone", toPhone);
        body.put("to_address", toAddress);
        body.put("to_ward_code", toWardCode);
        body.put("to_district_id", toDistrictId);

        body.put("weight", Math.max(weightGram, 1));
        body.put("length", length);
        body.put("width",  width);
        body.put("height", height);

        body.put("service_type_id", ghn.getServiceTypeId());
        body.put("from_district_id", ghn.getFromDistrictId());
        body.put("from_ward_code", ghn.getFromWardCode());

        // Nếu chưa thanh toán → để GHN thu hộ tiền hàng (COD)
        if (order.getPaymentStatus() != Order.PaymentStatus.PAID) {
            body.put("cod_amount", order.getTotalAmount().intValue());
        }

        // items[] — GHN yêu cầu có weight từng item (dùng weightGram từ variant,
        // fallback về 500g nếu không có)
        List<Map<String, Object>> ghnItems = items.stream().map(i -> {
            int itemWeight = i.getVariant().getWeightGram() != null
                    ? i.getVariant().getWeightGram() : 500;
            Map<String, Object> item = new HashMap<>();
            item.put("name",     i.getProductName());
            item.put("quantity", i.getQuantity());
            item.put("weight",   itemWeight);
            return item;
        }).toList();
        body.put("items", ghnItems);

        log.info("GHN createShippingOrder request: {}", body);

        try {
            ResponseEntity<String> res = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(body, shopHeaders()),
                    String.class
            );
            log.info("GHN createShippingOrder response: {}", res.getBody());

            JsonNode root = objectMapper.readTree(res.getBody());
            if (root.path("code").asInt() == 200) {
                return root.path("data").path("order_code").asText(null);
            }
            log.error("GHN createShippingOrder error response: {}", res.getBody());
        } catch (Exception e) {
            log.error("GHN createShippingOrder error: {}", e.getMessage());
        }
        return null;
    }

    // ── Parse helper ───────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseList(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode data = root.path("data");
            if (!data.isArray()) return List.of();
            return objectMapper.convertValue(
                    data,
                    objectMapper.getTypeFactory()
                            .constructCollectionType(List.class, Map.class)
            );
        } catch (Exception e) {
            log.error("GHN parseList error: {}", e.getMessage());
            return List.of();
        }
    }
}