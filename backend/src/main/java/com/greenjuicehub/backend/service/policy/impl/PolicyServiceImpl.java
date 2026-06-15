package com.greenjuicehub.backend.service.policy.impl;

import com.greenjuicehub.backend.dto.policy.response.PolicyResponse;
import com.greenjuicehub.backend.entity.ShippingPolicy.PolicyType;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.PolicyRepository;
import com.greenjuicehub.backend.service.policy.IPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PolicyServiceImpl implements IPolicyService {

    private final PolicyRepository policyRepository;

    @Override
    @Transactional(readOnly = true)
    public PolicyResponse getByType(String type) {
        PolicyType policyType;
        try {
            policyType = PolicyType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Loại chính sách không hợp lệ: " + type);
        }

        return policyRepository.findByTypeAndIsActiveTrue(policyType)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy chính sách"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PolicyResponse> getAll() {
        return policyRepository.findAllByIsActiveTrueOrderBySortOrderAsc()
                .stream().map(this::toResponse).toList();
    }

    private PolicyResponse toResponse(com.greenjuicehub.backend.entity.ShippingPolicy p) {
        return PolicyResponse.builder()
                .id(p.getId())
                .type(p.getType())
                .title(p.getTitle())
                .content(p.getContent())
                .sortOrder(p.getSortOrder())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}