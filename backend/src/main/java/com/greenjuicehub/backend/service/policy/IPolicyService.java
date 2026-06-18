package com.greenjuicehub.backend.service.policy;

import com.greenjuicehub.backend.dto.policy.response.PolicyResponse;

import java.util.List;

public interface IPolicyService {

    /** Lấy chính sách active theo type — dùng cho trang public */
    PolicyResponse getByType(String type);

    /** Lấy tất cả chính sách đang active, sắp xếp theo sort_order */
    List<PolicyResponse> getAll();
}