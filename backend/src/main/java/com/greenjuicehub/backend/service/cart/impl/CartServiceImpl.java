package com.greenjuicehub.backend.service.cart.impl;

import com.greenjuicehub.backend.dto.cart.request.AddToCartRequest;
import com.greenjuicehub.backend.dto.cart.request.UpdateCartItemRequest;
import com.greenjuicehub.backend.dto.cart.response.CartItemResponse;
import com.greenjuicehub.backend.dto.cart.response.CartResponse;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.cart.ICartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements ICartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        List<CartItem> items = cartItemRepository.findAllByCartIdWithDetails(cart.getId());
        return buildCartResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse addItem(Long userId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userId);

        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Biến thể sản phẩm không tồn tại"));

        if (!variant.getIsActive()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Sản phẩm này hiện không còn bán");
        }

        if (variant.getStockQty() < request.getQuantity()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng tồn kho không đủ. Còn lại: " + variant.getStockQty()
            );
        }

        // Nếu variant đã có trong giỏ → cộng thêm số lượng
        cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId())
                .ifPresentOrElse(
                        existingItem -> {
                            int newQty = existingItem.getQuantity() + request.getQuantity();
                            if (newQty > variant.getStockQty()) {
                                throw new AppException(
                                        HttpStatus.BAD_REQUEST,
                                        "Tổng số lượng vượt quá tồn kho. Còn lại: " + variant.getStockQty()
                                );
                            }
                            existingItem.setQuantity(newQty);
                            cartItemRepository.save(existingItem);
                        },
                        () -> {
                            Product product = productRepository.findById(request.getProductId())
                                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

                            CartItem newItem = CartItem.builder()
                                    .cart(cart)
                                    .product(product)
                                    .variant(variant)
                                    .quantity(request.getQuantity())
                                    .build();
                            cartItemRepository.save(newItem);
                        }
                );

        List<CartItem> items = cartItemRepository.findAllByCartIdWithDetails(cart.getId());
        return buildCartResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse updateItem(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        if (!cartItemRepository.existsByCartIdAndId(cart.getId(), cartItemId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không có trong giỏ hàng của bạn");
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm trong giỏ"));

        if (request.getQuantity() > item.getVariant().getStockQty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng vượt quá tồn kho. Còn lại: " + item.getVariant().getStockQty()
            );
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        List<CartItem> items = cartItemRepository.findAllByCartIdWithDetails(cart.getId());
        return buildCartResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long userId, Long cartItemId) {
        Cart cart = getOrCreateCart(userId);

        if (!cartItemRepository.existsByCartIdAndId(cart.getId(), cartItemId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không có trong giỏ hàng của bạn");
        }

        cartItemRepository.deleteById(cartItemId);

        List<CartItem> items = cartItemRepository.findAllByCartIdWithDetails(cart.getId());
        return buildCartResponse(cart, items);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteAllByCartId(cart.getId());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });
    }

    private CartResponse buildCartResponse(Cart cart, List<CartItem> items) {
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

    private CartItemResponse toCartItemResponse(CartItem item) {
        ProductVariant variant = item.getVariant();
        Product product = item.getProduct();

        String flavorName = variant.getFlavor() != null ? variant.getFlavor().getName() : null;
        String sizeName = variant.getSize() != null ? variant.getSize().getName() : null;

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

    private String buildVariantLabel(String flavor, String size) {
        if (flavor != null && size != null) return flavor + " · " + size;
        if (flavor != null) return flavor;
        if (size != null) return size;
        return null;
    }
}