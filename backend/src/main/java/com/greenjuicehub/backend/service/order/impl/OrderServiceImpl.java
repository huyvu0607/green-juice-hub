package com.greenjuicehub.backend.service.order.impl;

import com.greenjuicehub.backend.dto.order.request.BuyNowRequest;
import com.greenjuicehub.backend.dto.order.request.ApplyPromoRequest;
import com.greenjuicehub.backend.dto.order.request.PlaceOrderRequest;
import com.greenjuicehub.backend.dto.order.response.ApplyPromoResponse;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.OrderMapper;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.order.IOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements IOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final ProductVariantRepository productVariantRepository;


    // ─────────────────────────────────────────────────────────────────────────
    // ĐẶT HÀNG
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse placeOrder(Long userId, PlaceOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        // 1. Lấy địa chỉ giao hàng
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Địa chỉ giao hàng không tồn tại"));

        if (!address.getUser().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Địa chỉ không thuộc về bạn");
        }

        // 2. Lấy các cart items được chọn
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Giỏ hàng trống"));

        List<CartItem> selectedItems = cartItemRepository
                .findAllByCartIdWithDetails(cart.getId())
                .stream()
                .filter(i -> request.getCartItemIds().contains(i.getId()))
                .toList();

        if (selectedItems.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không tìm thấy sản phẩm đã chọn trong giỏ hàng");
        }

        // 3. Kiểm tra tồn kho từng item
        for (CartItem item : selectedItems) {
            ProductVariant variant = item.getVariant();
            if (!variant.getIsActive()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Sản phẩm \"" + item.getProduct().getName() + "\" hiện không còn bán");
            }
            if (variant.getStockQty() < item.getQuantity()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Sản phẩm \"" + item.getProduct().getName() + "\" chỉ còn " + variant.getStockQty() + " trong kho");
            }
        }

        // 4. Tính subtotal
        BigDecimal subtotal = selectedItems.stream()
                .map(i -> {
                    BigDecimal price = i.getVariant().getSalePrice() != null
                            ? i.getVariant().getSalePrice()
                            : i.getVariant().getOriginalPrice();
                    return price.multiply(BigDecimal.valueOf(i.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Áp mã khuyến mãi (nếu có)
        Promotion promotion = null;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            promotion = validatePromo(request.getPromoCode(), userId, subtotal);
            discountAmount = calculateDiscount(promotion, subtotal);
        }

        // 6. Tính phí ship (logic đơn giản, có thể mở rộng sau)
        BigDecimal shippingFee = calculateShippingFee(subtotal, discountAmount);
        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(shippingFee);

        // 7. Tạo Order
        Payment.PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());

        Order order = Order.builder()
                .user(user)
                .promotion(promotion)
                .orderCode(generateOrderCode())
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .shippingFee(shippingFee)
                .totalAmount(totalAmount)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .shippingAddress(orderMapper.toShippingAddressJson(address))
                .note(request.getNote())
                .build();

        order = orderRepository.save(order);

        // 8. Tạo OrderItems + trừ tồn kho
        final Order savedOrder = order;
        List<OrderItem> orderItems = selectedItems.stream().map(cartItem -> {
            ProductVariant variant = cartItem.getVariant();
            BigDecimal price = variant.getSalePrice() != null
                    ? variant.getSalePrice()
                    : variant.getOriginalPrice();

            // Trừ tồn kho
            variant.setStockQty(variant.getStockQty() - cartItem.getQuantity());

            String variantLabel = buildVariantLabel(
                    variant.getFlavor() != null ? variant.getFlavor().getName() : null,
                    variant.getSize() != null ? variant.getSize().getName() : null
            );

            return OrderItem.builder()
                    .order(savedOrder)
                    .product(cartItem.getProduct())
                    .variant(variant)
                    .productName(cartItem.getProduct().getName())
                    .variantName(variantLabel != null ? variantLabel : "")
                    .unitPrice(price)
                    .quantity(cartItem.getQuantity())
                    .subtotal(price.multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build();
        }).toList();

        orderItemRepository.saveAll(orderItems);

        // 9. Tạo Payment record
        Payment payment = Payment.builder()
                .order(savedOrder)
                .method(paymentMethod)
                .status(Payment.PaymentStatus.PENDING)
                .amount(totalAmount)
                .build();

        paymentRepository.save(payment);

        // 10. Ghi nhận lượt dùng mã khuyến mãi
        if (promotion != null) {
            promotion.setUsedCount(promotion.getUsedCount() + 1);
            promotionRepository.save(promotion);

            PromotionUsage usage = PromotionUsage.builder()
                    .promotion(promotion)
                    .user(user)
                    .order(savedOrder)
                    .build();
            promotionUsageRepository.save(usage);
        }

        // 11. Xoá các cart items đã đặt khỏi giỏ
        cartItemRepository.deleteAll(selectedItems);

        return orderMapper.toOrderResponse(savedOrder, orderItems, payment);
    }

    // ─────────────────────────────────────────────────────────────────────────
// MUA NGAY (không qua giỏ hàng)
// ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse buyNow(Long userId, BuyNowRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        // 1. Địa chỉ giao hàng
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Địa chỉ giao hàng không tồn tại"));

        if (!address.getUser().getId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Địa chỉ không thuộc về bạn");
        }

        // 2. Lấy variant
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        // 3. Kiểm tra tồn kho
        if (!variant.getIsActive()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Sản phẩm \"" + variant.getProduct().getName() + "\" hiện không còn bán");
        }
        if (variant.getStockQty() < request.getQuantity()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Sản phẩm \"" + variant.getProduct().getName() + "\" chỉ còn " + variant.getStockQty() + " trong kho");
        }

        // 4. Tính subtotal
        BigDecimal price = variant.getSalePrice() != null
                ? variant.getSalePrice()
                : variant.getOriginalPrice();
        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(request.getQuantity()));

        // 5. Áp mã khuyến mãi (nếu có)
        Promotion promotion = null;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            promotion = validatePromo(request.getPromoCode(), userId, subtotal);
            discountAmount = calculateDiscount(promotion, subtotal);
        }

        // 6. Phí ship
        BigDecimal shippingFee = calculateShippingFee(subtotal, discountAmount);
        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(shippingFee);

        // 7. Tạo Order
        Payment.PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());

        Order order = Order.builder()
                .user(user)
                .promotion(promotion)
                .orderCode(generateOrderCode())
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .shippingFee(shippingFee)
                .totalAmount(totalAmount)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .shippingAddress(orderMapper.toShippingAddressJson(address))
                .note(request.getNote())
                .build();

        order = orderRepository.save(order);

        // 8. Tạo OrderItem + trừ tồn kho
        String variantLabel = buildVariantLabel(
                variant.getFlavor() != null ? variant.getFlavor().getName() : null,
                variant.getSize() != null ? variant.getSize().getName() : null
        );

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(variant.getProduct())
                .variant(variant)
                .productName(variant.getProduct().getName())
                .variantName(variantLabel != null ? variantLabel : "")
                .unitPrice(price)
                .quantity(request.getQuantity())
                .subtotal(subtotal)
                .build();

        orderItemRepository.save(orderItem);
        variant.setStockQty(variant.getStockQty() - request.getQuantity());

        // 9. Tạo Payment record
        Payment payment = Payment.builder()
                .order(order)
                .method(paymentMethod)
                .status(Payment.PaymentStatus.PENDING)
                .amount(totalAmount)
                .build();

        paymentRepository.save(payment);

        // 10. Ghi nhận lượt dùng mã
        if (promotion != null) {
            promotion.setUsedCount(promotion.getUsedCount() + 1);
            promotionRepository.save(promotion);

            PromotionUsage usage = PromotionUsage.builder()
                    .promotion(promotion)
                    .user(user)
                    .order(order)
                    .build();
            promotionUsageRepository.save(usage);
        }

        return orderMapper.toOrderResponse(order, List.of(orderItem), payment);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // DANH SÁCH ĐƠN HÀNG
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getMyOrders(Long userId, String status, Pageable pageable) {
        Page<Order> page;
        if (status != null && !status.isBlank()) {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            page = orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, orderStatus, pageable);
        } else {
            page = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
        return page.map(order -> {
            List<OrderItem> items = orderItemRepository.findAllByOrderIdWithDetails(order.getId());
            Payment payment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
            return orderMapper.toOrderResponse(order, items, payment);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHI TIẾT ĐƠN HÀNG
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));

        List<OrderItem> items = orderItemRepository.findAllByOrderIdWithDetails(orderId);
        Payment payment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId).orElse(null);

        return orderMapper.toOrderResponse(order, items, payment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HUỶ ĐƠN
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể huỷ đơn hàng đang ở trạng thái chờ xác nhận");
        }

        // Hoàn lại tồn kho
        List<OrderItem> items = orderItemRepository.findAllByOrderIdWithDetails(orderId);
        items.forEach(item -> {
            ProductVariant variant = item.getVariant();
            variant.setStockQty(variant.getStockQty() + item.getQuantity());
        });

        // Hoàn lại lượt dùng mã
        if (order.getPromotion() != null) {
            Promotion promo = order.getPromotion();
            promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
            promotionRepository.save(promo);
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order = orderRepository.save(order);

        Payment payment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId).orElse(null);
        return orderMapper.toOrderResponse(order, items, payment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ÁP MÃ KHUYẾN MÃI (preview trước khi đặt)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public ApplyPromoResponse applyPromo(Long userId, ApplyPromoRequest request) {
        BigDecimal subtotal;

        if (request.getVariantId() != null) {
            // ── BuyNow: tính từ variant ──────────────────────────────────────
            ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
            BigDecimal price = variant.getSalePrice() != null
                    ? variant.getSalePrice()
                    : variant.getOriginalPrice();
            subtotal = price.multiply(BigDecimal.valueOf(request.getQuantity()));
        } else {
            // ── Cart: tính từ cartItemIds ────────────────────────────────────
            if (request.getCartItemIds() == null || request.getCartItemIds().isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Phải chọn ít nhất 1 sản phẩm");
            }
            Cart cart = cartRepository.findByUserId(userId)
                    .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Giỏ hàng trống"));

            List<CartItem> selectedItems = cartItemRepository
                    .findAllByCartIdWithDetails(cart.getId())
                    .stream()
                    .filter(i -> request.getCartItemIds().contains(i.getId()))
                    .toList();

            if (selectedItems.isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Không tìm thấy sản phẩm đã chọn");
            }

            subtotal = selectedItems.stream()
                    .map(i -> {
                        BigDecimal price = i.getVariant().getSalePrice() != null
                                ? i.getVariant().getSalePrice()
                                : i.getVariant().getOriginalPrice();
                        return price.multiply(BigDecimal.valueOf(i.getQuantity()));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        Promotion promo = validatePromo(request.getPromoCode(), userId, subtotal);
        BigDecimal discount = calculateDiscount(promo, subtotal);

        return ApplyPromoResponse.builder()
                .promoCode(promo.getCode())
                .promoName(promo.getName())
                .subtotal(subtotal)
                .discountAmount(discount)
                .totalAfterDiscount(subtotal.subtract(discount))
                .message("Áp dụng mã thành công! Giảm " + formatDiscount(promo))
                .build();
    }
    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts(Long userId) {
        Map<String, Long> counts = new HashMap<>();
        counts.put("ALL", orderRepository.countByUserId(userId));
        for (Order.OrderStatus status : Order.OrderStatus.values()) {
            counts.put(status.name(), orderRepository.countByUserIdAndStatus(userId, status));
        }
        return counts;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** Validate mã khuyến mãi — ném AppException nếu không hợp lệ */
    private Promotion validatePromo(String code, Long userId, BigDecimal subtotal) {
        Promotion promo = promotionRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Mã khuyến mãi không tồn tại"));

        if (!promo.getIsActive()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã khuyến mãi đã bị vô hiệu hoá");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(promo.getStartsAt()) || now.isAfter(promo.getEndsAt())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian áp dụng");
        }

        if (promo.getUsedCount() >= promo.getMaxUses()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã khuyến mãi đã hết lượt sử dụng");
        }

        if (subtotal.compareTo(promo.getMinOrderValue()) < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng phải đạt tối thiểu " + promo.getMinOrderValue().toPlainString() + "đ để áp dụng mã này");
        }

        // Kiểm tra mã personal
        if (promo.getTarget() == Promotion.Target.PERSONAL) {
            if (promo.getUser() == null || !promo.getUser().getId().equals(userId)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Mã khuyến mãi này không áp dụng cho tài khoản của bạn");
            }
        }

        // Kiểm tra giới hạn mỗi user
        if (promo.getMaxUsesPerUser() != null) {
            int usedByUser = promotionUsageRepository.countByPromotionIdAndUserId(promo.getId(), userId);
            if (usedByUser >= promo.getMaxUsesPerUser()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Bạn đã dùng hết lượt cho mã khuyến mãi này");
            }
        }

        return promo;
    }

    /** Tính số tiền được giảm */
    private BigDecimal calculateDiscount(Promotion promo, BigDecimal subtotal) {
        if (promo.getType() == Promotion.PromotionType.PERCENT) {
            return subtotal.multiply(promo.getValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.FLOOR);
        }
        // FIXED — không được giảm nhiều hơn subtotal
        return promo.getValue().min(subtotal);
    }

    /** Tính phí ship đơn giản: miễn ship nếu đơn >= 200k sau giảm */
    private BigDecimal calculateShippingFee(BigDecimal subtotal, BigDecimal discount) {
        BigDecimal afterDiscount = subtotal.subtract(discount);
        return afterDiscount.compareTo(BigDecimal.valueOf(200_000)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(30_000);
    }

    /** Parse paymentMethod string → enum */
    private Payment.PaymentMethod parsePaymentMethod(String method) {
        try {
            return Payment.PaymentMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Phương thức thanh toán không hợp lệ: " + method);
        }
    }

    /** Tạo mã đơn hàng unique dạng GJH-XXXXXXXX */
    private String generateOrderCode() {
        String code;
        do {
            String random = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            code = "GJH-" + random;
        } while (orderRepository.existsByOrderCode(code));
        return code;
    }

    private String buildVariantLabel(String flavor, String size) {
        if (flavor != null && size != null) return flavor + " · " + size;
        if (flavor != null) return flavor;
        if (size != null) return size;
        return null;
    }

    private String formatDiscount(Promotion promo) {
        if (promo.getType() == Promotion.PromotionType.PERCENT) {
            return promo.getValue().toPlainString() + "%";
        }
        return promo.getValue().toPlainString() + "đ";
    }
}