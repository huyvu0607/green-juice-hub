package com.greenjuicehub.backend.service.cart;

import com.greenjuicehub.backend.dto.cart.request.AddToCartRequest;
import com.greenjuicehub.backend.dto.cart.request.UpdateCartItemRequest;
import com.greenjuicehub.backend.dto.cart.response.CartResponse;

public interface ICartService {

    CartResponse getCart(Long userId);

    CartResponse addItem(Long userId, AddToCartRequest request);

    CartResponse updateItem(Long userId, Long cartItemId, UpdateCartItemRequest request);

    CartResponse removeItem(Long userId, Long cartItemId);

    void clearCart(Long userId);
}