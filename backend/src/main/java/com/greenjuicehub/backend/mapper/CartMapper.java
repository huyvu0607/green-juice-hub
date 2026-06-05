package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.cart.response.CartItemResponse;
import com.greenjuicehub.backend.dto.cart.response.CartResponse;
import com.greenjuicehub.backend.entity.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class CartMapper {

    // ==================== CartItem → CartItemResponse ====================
    public CartItemResponse toCartItemResponse(CartItem item) {
        ProductVariant variant = item.getVariant();
        Product product = item.getProduct();

        String flavorName = variant.getFlavor() != null ? variant.getFlavor().getName() : null;
        String sizeName   = variant.getSize()   != null ? variant.getSize().getName()   : null;
        String variantLabel = buildVariantLabel(flavorName, sizeName);

        String imageUrl = product.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(null);

        BigDecimal price = variant.getSalePrice() != null
                ? variant.getSalePrice()
                : variant.getOriginalPrice();

        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

        return CartItemResponse.builder()
                .cartItemId(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .imageUrl(imageUrl)
                .variantId(variant.getId())
                .flavorName(flavorName)
                .sizeName(sizeName)
                .variantLabel(variantLabel)
                .originalPrice(variant.getOriginalPrice())
                .salePrice(variant.getSalePrice())
                .discountPercent(variant.getDiscountPercent() != null
                        ? variant.getDiscountPercent().intValue()
                        : null)
                .quantity(item.getQuantity())
                .subtotal(subtotal)
                .stockQty(variant.getStockQty())
                .inStock(variant.getStockQty() > 0)
                .build();
    }

    // ==================== Cart + items → CartResponse ====================
    public CartResponse toCartResponse(Cart cart, List<CartItem> items) {
        List<CartItemResponse> itemResponses = items.stream()
                .map(this::toCartItemResponse)
                .toList();

        int totalQuantity = itemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(itemResponses)
                .totalItems(itemResponses.size())
                .totalQuantity(totalQuantity)
                .totalAmount(totalAmount)
                .build();
    }

    // ==================== Helper ====================
    private String buildVariantLabel(String flavor, String size) {
        if (flavor != null && size != null) return flavor + " · " + size;
        if (flavor != null) return flavor;
        if (size != null) return size;
        return null;
    }
}