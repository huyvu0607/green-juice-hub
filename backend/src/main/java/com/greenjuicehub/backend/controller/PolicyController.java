package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.policy.response.PolicyResponse;
import com.greenjuicehub.backend.service.policy.IPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final IPolicyService policyService;

    @GetMapping
    public ResponseEntity<List<PolicyResponse>> getAll() {
        return ResponseEntity.ok(policyService.getAll());
    }

    @GetMapping("/{type}")
    public ResponseEntity<PolicyResponse> getByType(@PathVariable String type) {
        return ResponseEntity.ok(policyService.getByType(type));
    }
}