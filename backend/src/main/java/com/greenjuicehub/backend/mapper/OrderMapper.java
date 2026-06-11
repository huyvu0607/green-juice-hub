package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.order.response.OrderItemResponse;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import com.greenjuicehub.backend.dto.order.response.ShippingAddressResponse;
import com.greenjuicehub.backend.entity.Address;
import com.greenjuicehub.backend.entity.Order;
import com.greenjuicehub.backend.entity.OrderItem;
import com.greenjuicehub.backend.entity.Payment;
import com.greenjuicehub.backend.entity.ProductImage;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class OrderMapper {

    // ==================== OrderItem → OrderItemResponse ====================
    public OrderItemResponse toOrderItemResponse(OrderItem item, boolean hasReviewed) {
        String imageUrl = item.getProduct().getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(null);

        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productSlug(item.getProduct().getSlug())
                .variantId(item.getVariant().getId())
                .productName(item.getProductName())
                .variantName(item.getVariantName())
                .imageUrl(imageUrl)
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .hasReviewed(hasReviewed)
                .build();
    }

    // ==================== Order + items + payment → OrderResponse ====================
    public OrderResponse toOrderResponse(Order order, List<OrderItem> items,
                                         Payment latestPayment, Set<Long> reviewedIds) {
        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> toOrderItemResponse(item,
                        reviewedIds.contains(item.getProduct().getId())))
                .toList();

        ShippingAddressResponse shippingAddress = parseShippingAddress(order.getShippingAddress());
        String promoCode = order.getPromotion() != null ? order.getPromotion().getCode() : null;
        String paymentMethod = latestPayment != null ? latestPayment.getMethod().name() : null;

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .paymentMethod(paymentMethod)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .promoCode(promoCode)
                .note(order.getNote())
                .cancelReason(order.getCancelReason())
                .shippingAddress(shippingAddress)
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
    public OrderResponse toOrderResponse(Order order, List<OrderItem> items, Payment latestPayment) {
        return toOrderResponse(order, items, latestPayment, Set.of());
    }
    // ==================== Helper: Address → JSON string (snapshot) ====================
    public String toShippingAddressJson(Address address) {
        return String.format(
                "{\"fullName\":\"%s\",\"phone\":\"%s\",\"province\":\"%s\",\"district\":\"%s\",\"ward\":\"%s\",\"detail\":\"%s\"}",
                escape(address.getFullName()),
                escape(address.getPhone()),
                escape(address.getProvince()),
                escape(address.getDistrict()),
                escape(address.getWard()),
                escape(address.getDetail())
        );
    }

    // ==================== Helper: JSON string → ShippingAddressResponse ====================
    private ShippingAddressResponse parseShippingAddress(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return ShippingAddressResponse.builder()
                    .fullName(extractJson(json, "fullName"))
                    .phone(extractJson(json, "phone"))
                    .province(extractJson(json, "province"))
                    .district(extractJson(json, "district"))
                    .ward(extractJson(json, "ward"))
                    .detail(extractJson(json, "detail"))
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    /** Trích value từ JSON string đơn giản: {"key":"value"} */
    private String extractJson(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1).replace("\\\"", "\"").replace("\\\\", "\\");
        }
        return null;
    }

    /** Escape ký tự đặc biệt trong JSON string */
    private String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}