package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.product.response.*;
import com.greenjuicehub.backend.entity.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Component
public class ProductMapper {

    // ==================== Category → CategoryResponse ====================
    public CategoryResponse toCategory(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .sortOrder(c.getSortOrder())
                .build();
    }

    // ==================== Flavor → FlavorResponse ====================
    public FlavorResponse toFlavor(Flavor f) {
        return FlavorResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .isActive(f.getIsActive())
                .build();
    }

    // ==================== Size → SizeResponse ====================
    public SizeResponse toSize(Size s) {
        return SizeResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .isActive(s.getIsActive())
                .build();
    }

    // ==================== ProductVariant → ProductVariantResponse ====================
    public ProductVariantResponse toVariant(ProductVariant v) {
        return ProductVariantResponse.builder()
                .id(v.getId())
                .flavor(v.getFlavor() != null ? toFlavor(v.getFlavor()) : null)
                .size(v.getSize()     != null ? toSize(v.getSize())     : null)
                .originalPrice(v.getOriginalPrice())
                .salePrice(v.getSalePrice())
                .discountPercent(v.getDiscountPercent())
                .stockQty(v.getStockQty())
                .sortOrder(v.getSortOrder())
                .build();
    }

    // ==================== Product → ProductSummaryResponse ====================
    // Service query variants + images trước, rồi truyền vào đây
    public ProductSummaryResponse toSummary(
            Product product,
            List<ProductVariant> variants,
            List<ProductImage> images
    ) {
        String primaryImage = images.stream()
                .filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(null);

        BigDecimal minSalePrice = variants.stream()
                .map(ProductVariant::getSalePrice)
                .min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        BigDecimal maxSalePrice = variants.stream()
                .map(ProductVariant::getSalePrice)
                .max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        BigDecimal minOriginalPrice = variants.stream()
                .map(ProductVariant::getOriginalPrice)
                .min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        BigDecimal maxDiscountPercent = variants.stream()
                .map(ProductVariant::getDiscountPercent)
                .max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        boolean inStock = variants.stream()
                .anyMatch(v -> v.getStockQty() > 0);

        Long defaultVariantId = variants.stream()
                .filter(v -> v.getStockQty() > 0)
                .map(ProductVariant::getId)
                .findFirst()
                .orElse(variants.isEmpty() ? null : variants.get(0).getId());

        List<String> tags = product.getTags() != null
                ? product.getTags().stream().map(ProductTag::getTag).toList()
                : List.of();

        return ProductSummaryResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .primaryImage(primaryImage)
                .avgRating(product.getAvgRating())
                .reviewCount(product.getReviewCount())
                .minSalePrice(minSalePrice)
                .maxSalePrice(maxSalePrice)
                .minOriginalPrice(minOriginalPrice)
                .maxDiscountPercent(maxDiscountPercent)
                .tags(tags)
                .inStock(inStock)
                .categoryName(product.getCategory().getName())
                .defaultVariantId(defaultVariantId)
                .build();
    }

    // ==================== Product → ProductDetailResponse ====================
    // Service query variants + images + related trước, rồi truyền vào đây
    public ProductDetailResponse toDetail(
            Product product,
            List<ProductVariant> variants,
            List<String> imageUrls,
            List<String> tags,
            List<ProductSummaryResponse> relatedProducts
    ) {
        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .avgRating(product.getAvgRating())
                .reviewCount(product.getReviewCount())
                .category(toCategory(product.getCategory()))
                .images(imageUrls)
                .tags(tags)
                .variants(variants.stream().map(this::toVariant).toList())
                .relatedProducts(relatedProducts)
                .build();
    }
}