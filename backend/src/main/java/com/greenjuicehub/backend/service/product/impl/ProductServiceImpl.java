package com.greenjuicehub.backend.service.product.impl;

import com.greenjuicehub.backend.dto.product.request.ProductFilterRequest;
import com.greenjuicehub.backend.dto.product.response.*;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.product.IProductService;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements IProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FlavorRepository flavorRepository;
    private final SizeRepository sizeRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;

    @Override
    public Page<ProductSummaryResponse> getProducts(ProductFilterRequest request) {
        Specification<Product> spec = buildSpec(request);
        Sort sort = buildSort(request.getSortBy());
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        return productRepository.findAll(spec, pageable)
                .map(this::toSummary);
    }

    @Override
    public ProductDetailResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndIsActiveTrue(slug)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        List<ProductVariant> variants = variantRepository
                .findAllByProductIdAndIsActiveTrueOrderBySortOrderAsc(product.getId());

        List<String> images = imageRepository
                .findAllByProductIdOrderBySortOrderAsc(product.getId())
                .stream().map(ProductImage::getImageUrl).toList();

        List<String> tags = product.getTags() != null
                ? product.getTags().stream().map(ProductTag::getTag).toList()
                : List.of();

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .avgRating(product.getAvgRating())
                .reviewCount(product.getReviewCount())
                .category(toCategory(product.getCategory()))
                .images(images)
                .tags(tags)
                .variants(variants.stream().map(this::toVariant).toList())
                .build();
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByIsActiveTrueOrderBySortOrderAsc()
                .stream().map(this::toCategory).toList();
    }

    @Override
    public List<FlavorResponse> getAllFlavors() {
        return flavorRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream().map(f -> FlavorResponse.builder()
                        .id(f.getId()).name(f.getName()).build())
                .toList();
    }

    @Override
    public List<SizeResponse> getAllSizes() {
        return sizeRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream().map(s -> SizeResponse.builder()
                        .id(s.getId()).name(s.getName()).build())
                .toList();
    }

    // ==================== SPEC ====================
    private Specification<Product> buildSpec(ProductFilterRequest req) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            // Chỉ lấy sản phẩm active
            predicates.add(cb.isTrue(root.get("isActive")));

            // Category
            if (req.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), req.getCategoryId()));
            }

            // Keyword — tìm theo tên hoặc tên category
            if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
                String kw = "%" + req.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), kw),
                        cb.like(cb.lower(root.get("category").get("name")), kw)
                ));
            }

            // Rating
            if (req.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), req.getMinRating()));
            }

            // Tags — nhận chuỗi "bestseller,organic", join sang bảng product_tags
            if (req.getTags() != null && !req.getTags().isBlank()) {
                List<String> tagList = Arrays.asList(req.getTags().split(","));
                var tagJoin = root.join("tags", JoinType.INNER);
                predicates.add(tagJoin.get("tag").in(tagList));
                query.distinct(true);
            }

            // Flavor, Size, Price, inStock, onSale — dùng chung 1 join variants
            boolean needVariantJoin = req.getFlavorIds() != null && !req.getFlavorIds().isEmpty()
                    || req.getSizeIds()   != null && !req.getSizeIds().isEmpty()
                    || req.getMinPrice()  != null
                    || req.getMaxPrice()  != null
                    || Boolean.TRUE.equals(req.getInStock())
                    || Boolean.TRUE.equals(req.getOnSale());

            if (needVariantJoin) {
                var v = root.join("variants", JoinType.INNER);
                predicates.add(cb.isTrue(v.get("isActive")));
                query.distinct(true);

                // Flavor
                if (req.getFlavorIds() != null && !req.getFlavorIds().isEmpty()) {
                    predicates.add(v.get("flavor").get("id").in(req.getFlavorIds()));
                }

                // Size
                if (req.getSizeIds() != null && !req.getSizeIds().isEmpty()) {
                    predicates.add(v.get("size").get("id").in(req.getSizeIds()));
                }

                // Min price
                if (req.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(v.get("salePrice"), req.getMinPrice()));
                }

                // Max price
                if (req.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(v.get("salePrice"), req.getMaxPrice()));
                }

                // inStock — stockQty > 0
                if (Boolean.TRUE.equals(req.getInStock())) {
                    predicates.add(cb.greaterThan(v.get("stockQty"), 0));
                }

                // onSale — discountPercent > 0
                if (Boolean.TRUE.equals(req.getOnSale())) {
                    predicates.add(cb.greaterThan(v.get("discountPercent"), BigDecimal.ZERO));
                }
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    // ==================== SORT ====================
    private Sort buildSort(String sortBy) {
        if (sortBy == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        return switch (sortBy) {
            case "newest"     -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "rating"     -> Sort.by(Sort.Direction.DESC, "avgRating");
            case "bestseller" -> Sort.by(Sort.Direction.DESC, "reviewCount");
            default           -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    // ==================== MAPPER ====================
    private ProductSummaryResponse toSummary(Product product) {
        List<ProductVariant> variants = variantRepository
                .findAllByProductIdAndIsActiveTrueOrderBySortOrderAsc(product.getId());

        String primaryImage = imageRepository
                .findAllByProductIdOrderBySortOrderAsc(product.getId())
                .stream().filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(null);

        BigDecimal minSalePrice = variants.stream()
                .map(ProductVariant::getSalePrice)
                .min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        BigDecimal maxDiscountPercent = variants.stream()
                .map(ProductVariant::getDiscountPercent)
                .max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        boolean inStock = variants.stream().anyMatch(v -> v.getStockQty() > 0);

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
                .maxDiscountPercent(maxDiscountPercent)
                .tags(tags)
                .inStock(inStock)
                .categoryName(product.getCategory().getName())
                .build();
    }

    private CategoryResponse toCategory(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .sortOrder(c.getSortOrder())
                .build();
    }

    private ProductVariantResponse toVariant(ProductVariant v) {
        return ProductVariantResponse.builder()
                .id(v.getId())
                .flavor(v.getFlavor() != null ? FlavorResponse.builder()
                        .id(v.getFlavor().getId())
                        .name(v.getFlavor().getName())
                        .build() : null)
                .size(v.getSize() != null ? SizeResponse.builder()
                        .id(v.getSize().getId())
                        .name(v.getSize().getName())
                        .build() : null)
                .originalPrice(v.getOriginalPrice())
                .salePrice(v.getSalePrice())
                .discountPercent(v.getDiscountPercent())
                .stockQty(v.getStockQty())
                .sortOrder(v.getSortOrder())
                .build();
    }
}