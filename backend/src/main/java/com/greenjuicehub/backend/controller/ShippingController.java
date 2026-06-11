package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.service.shipping.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final GhnService ghnService;

    /** GET /api/shipping/provinces */
    @GetMapping("/provinces")
    public ResponseEntity<List<Map<String, Object>>> getProvinces() {
        return ResponseEntity.ok(ghnService.getProvinces());
    }

    /** GET /api/shipping/districts?provinceId=269 */
    @GetMapping("/districts")
    public ResponseEntity<List<Map<String, Object>>> getDistricts(
            @RequestParam Integer provinceId
    ) {
        return ResponseEntity.ok(ghnService.getDistricts(provinceId));
    }

    /** GET /api/shipping/wards?districtId=1454 */
    @GetMapping("/wards")
    public ResponseEntity<List<Map<String, Object>>> getWards(
            @RequestParam Integer districtId
    ) {
        return ResponseEntity.ok(ghnService.getWards(districtId));
    }
}