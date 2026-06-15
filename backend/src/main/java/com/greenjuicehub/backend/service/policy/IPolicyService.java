package com.greenjuicehub.backend.service.policy;

import com.greenjuicehub.backend.dto.policy.response.PolicyResponse;
import java.util.List;

public interface IPolicyService {
    PolicyResponse getByType(String type);
    List<PolicyResponse> getAll();
}