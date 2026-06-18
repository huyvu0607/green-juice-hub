package com.greenjuicehub.backend.service.policy;

import com.greenjuicehub.backend.dto.policy.request.SavePolicyRequest;
import com.greenjuicehub.backend.dto.policy.response.PolicyResponse;

import java.util.List;

public interface IAdminPolicyService {

    /** Lấy tất cả chính sách (kể cả inactive) — dùng cho trang quản trị */
    List<PolicyResponse> getAllForAdmin();

    /** Lấy chi tiết 1 chính sách theo id — dùng khi mở form edit */
    PolicyResponse getById(Long id);

    /** Tạo chính sách mới */
    PolicyResponse create(SavePolicyRequest request);

    /** Cập nhật nội dung chính sách */
    PolicyResponse update(Long id, SavePolicyRequest request);

    /** Bật / tắt trạng thái hiển thị */
    PolicyResponse toggleActive(Long id);
}