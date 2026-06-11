package com.greenjuicehub.backend.service.user.impl;

import com.greenjuicehub.backend.dto.address.request.CreateAddressRequest;
import com.greenjuicehub.backend.dto.address.request.UpdateAddressRequest;
import com.greenjuicehub.backend.dto.address.response.AddressResponse;
import com.greenjuicehub.backend.entity.Address;
import com.greenjuicehub.backend.entity.User;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.AddressMapper;
import com.greenjuicehub.backend.repository.AddressRepository;
import com.greenjuicehub.backend.repository.UserRepository;
import com.greenjuicehub.backend.service.user.IAddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements IAddressService {

    private static final int MAX_ADDRESSES_PER_USER = 5;

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final AddressMapper addressMapper;


    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(Long userId) {
        return addressRepository.findAllByUserIdOrdered(userId)
                .stream()
                .map(addressMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddress(Long userId, Long addressId) {
        Address address = findAddressOrThrow(userId, addressId);
        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse createAddress(Long userId, CreateAddressRequest request) {
        // Giới hạn số lượng địa chỉ
        int currentCount = addressRepository.countByUserId(userId);
        if (currentCount >= MAX_ADDRESSES_PER_USER) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Bạn chỉ có thể lưu tối đa " + MAX_ADDRESSES_PER_USER + " địa chỉ");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        // Nếu đây là địa chỉ đầu tiên → tự động set default
        boolean shouldBeDefault = Boolean.TRUE.equals(request.getIsDefault())
                || currentCount == 0;

        if (shouldBeDefault) {
            addressRepository.clearDefaultByUserId(userId);
        }

        Address address = addressMapper.toAddress(request, user, shouldBeDefault);

        return addressMapper.toResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, UpdateAddressRequest request) {
        Address address = findAddressOrThrow(userId, addressId);

        // Nếu muốn set default → bỏ default các địa chỉ khác
        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.clearDefaultByUserId(userId);
            address.setIsDefault(true);
        }

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setProvince(request.getProvince());
        address.setDistrict(request.getDistrict());
        address.setWard(request.getWard());
        address.setDistrictId(request.getDistrictId());
        address.setWardCode(request.getWardCode());
        address.setDetail(request.getDetail());

        return addressMapper.toResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = findAddressOrThrow(userId, addressId);

        addressRepository.delete(address);

        // Nếu vừa xoá địa chỉ default → tự động set địa chỉ đầu tiên còn lại làm default
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.findAllByUserIdOrdered(userId)
                    .stream()
                    .findFirst()
                    .ifPresent(first -> {
                        first.setIsDefault(true);
                        addressRepository.save(first);
                    });
        }
    }

    @Override
    @Transactional
    public AddressResponse setDefault(Long userId, Long addressId) {
        Address address = findAddressOrThrow(userId, addressId);

        if (Boolean.TRUE.equals(address.getIsDefault())) {
            return addressMapper.toResponse(address); // Đã là default rồi, không làm gì thêm
        }

        addressRepository.clearDefaultByUserId(userId);
        address.setIsDefault(true);
        return addressMapper.toResponse(addressRepository.save(address));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Address findAddressOrThrow(Long userId, Long addressId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy địa chỉ hoặc bạn không có quyền truy cập"));
    }

}