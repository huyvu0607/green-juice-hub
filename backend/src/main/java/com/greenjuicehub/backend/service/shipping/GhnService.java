package com.greenjuicehub.backend.service.shipping;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenjuicehub.backend.config.properties.GhnProperties;
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