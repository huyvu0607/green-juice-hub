package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.address.request.CreateAddressRequest;
import com.greenjuicehub.backend.dto.address.request.UpdateAddressRequest;
import com.greenjuicehub.backend.dto.address.response.AddressResponse;
import com.greenjuicehub.backend.service.user.IAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final IAddressService addressService;

    /**
     * GET /api/users/me/addresses
     * Lấy danh sách địa chỉ (default lên đầu)
     */
    @GetMapping
    public ResponseEntity<List<AddressResponse>> getAddresses(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(addressService.getAddresses(userId));
    }

    /**
     * GET /api/users/me/addresses/{addressId}
     * Lấy chi tiết 1 địa chỉ
     */
    @GetMapping("/{addressId}")
    public ResponseEntity<AddressResponse> getAddress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long addressId
    ) {
        return ResponseEntity.ok(addressService.getAddress(userId, addressId));
    }

    /**
     * POST /api/users/me/addresses
     * Tạo địa chỉ mới (tối đa 5)
     */
    @PostMapping
    public ResponseEntity<AddressResponse> createAddress(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateAddressRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(addressService.createAddress(userId, request));
    }

    /**
     * PUT /api/users/me/addresses/{addressId}
     * Cập nhật địa chỉ
     */
    @PutMapping("/{addressId}")
    public ResponseEntity<AddressResponse> updateAddress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long addressId,
            @Valid @RequestBody UpdateAddressRequest request
    ) {
        return ResponseEntity.ok(addressService.updateAddress(userId, addressId, request));
    }

    /**
     * DELETE /api/users/me/addresses/{addressId}
     * Xoá địa chỉ
     */
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long addressId
    ) {
        addressService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/users/me/addresses/{addressId}/default
     * Đặt làm địa chỉ mặc định
     */
    @PatchMapping("/{addressId}/default")
    public ResponseEntity<AddressResponse> setDefault(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long addressId
    ) {
        return ResponseEntity.ok(addressService.setDefault(userId, addressId));
    }
}