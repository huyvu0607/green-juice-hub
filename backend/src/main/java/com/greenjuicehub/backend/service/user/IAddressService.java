package com.greenjuicehub.backend.service.user;

import com.greenjuicehub.backend.dto.address.request.CreateAddressRequest;
import com.greenjuicehub.backend.dto.address.request.UpdateAddressRequest;
import com.greenjuicehub.backend.dto.address.response.AddressResponse;

import java.util.List;

public interface IAddressService {

    /** Lấy danh sách tất cả địa chỉ của user (default lên đầu) */
    List<AddressResponse> getAddresses(Long userId);

    /** Lấy chi tiết 1 địa chỉ theo id */
    AddressResponse getAddress(Long userId, Long addressId);

    /** Tạo địa chỉ mới (tối đa 5 địa chỉ / user) */
    AddressResponse createAddress(Long userId, CreateAddressRequest request);

    /** Cập nhật địa chỉ */
    AddressResponse updateAddress(Long userId, Long addressId, UpdateAddressRequest request);

    /** Xoá địa chỉ */
    void deleteAddress(Long userId, Long addressId);

    /** Đặt 1 địa chỉ làm mặc định */
    AddressResponse setDefault(Long userId, Long addressId);
}