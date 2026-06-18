package com.greenjuicehub.backend.service.policy.impl;

import com.greenjuicehub.backend.dto.policy.request.SavePolicyRequest;
import com.greenjuicehub.backend.dto.policy.response.PolicyResponse;
import com.greenjuicehub.backend.entity.ShippingPolicy;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.PolicyRepository;
import com.greenjuicehub.backend.service.policy.IAdminPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPolicyServiceImpl implements IAdminPolicyService {

    private final PolicyRepository policyRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // DANH SÁCH
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<PolicyResponse> getAllForAdmin() {
        return policyRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHI TIẾT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PolicyResponse getById(Long id) {
        return toResponse(findByIdOrThrow(id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TẠO MỚI
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PolicyResponse create(SavePolicyRequest request) {
        // Mỗi type chỉ được tồn tại 1 bản ghi (UNIQUE constraint)
        if (policyRepository.existsByType(request.getType())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Chính sách loại \"" + request.getType() + "\" đã tồn tại. Hãy chỉnh sửa thay vì tạo mới.");
        }

        ShippingPolicy entity = ShippingPolicy.builder()
                .type(request.getType())
                .title(request.getTitle())
                .content(request.getContent())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return toResponse(policyRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CẬP NHẬT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PolicyResponse update(Long id, SavePolicyRequest request) {
        ShippingPolicy entity = findByIdOrThrow(id);

        // Nếu đổi type, kiểm tra không trùng với bản ghi khác
        if (!entity.getType().equals(request.getType())
                && policyRepository.existsByTypeAndIdNot(request.getType(), id)) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Chính sách loại \"" + request.getType() + "\" đã tồn tại.");
        }

        entity.setType(request.getType());
        entity.setTitle(request.getTitle());
        entity.setContent(request.getContent());
        if (request.getSortOrder() != null) entity.setSortOrder(request.getSortOrder());
        if (request.getIsActive()   != null) entity.setIsActive(request.getIsActive());

        return toResponse(policyRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BẬT / TẮT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PolicyResponse toggleActive(Long id) {
        ShippingPolicy entity = findByIdOrThrow(id);
        entity.setIsActive(!entity.getIsActive());
        return toResponse(policyRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private ShippingPolicy findByIdOrThrow(Long id) {
        return policyRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy chính sách với id: " + id));
    }

    private PolicyResponse toResponse(ShippingPolicy p) {
        return PolicyResponse.builder()
                .id(p.getId())
                .type(p.getType())
                .title(p.getTitle())
                .content(p.getContent())
                .sortOrder(p.getSortOrder())
                .isActive(p.getIsActive())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}