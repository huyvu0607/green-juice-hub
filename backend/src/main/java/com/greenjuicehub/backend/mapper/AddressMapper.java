package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.address.request.CreateAddressRequest;
import com.greenjuicehub.backend.dto.address.response.AddressResponse;
import com.greenjuicehub.backend.entity.Address;
import com.greenjuicehub.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    // ==================== CreateAddressRequest → Address ====================
    public Address toAddress(CreateAddressRequest request, User user, boolean isDefault) {
        return Address.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .province(request.getProvince())
                .district(request.getDistrict())
                .ward(request.getWard())
                .detail(request.getDetail())
                .isDefault(isDefault)
                .build();
    }

    // ==================== Address → AddressResponse ====================
    public AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .province(address.getProvince())
                .district(address.getDistrict())
                .ward(address.getWard())
                .detail(address.getDetail())
                .isDefault(address.getIsDefault())
                .build();
    }
}