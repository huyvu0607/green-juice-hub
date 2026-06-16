package com.greenjuicehub.backend.service.product.impl;

import com.greenjuicehub.backend.dto.product.request.ProductFilterRequest;
import com.greenjuicehub.backend.dto.product.response.*;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.ProductMapper;
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
    private final ProductMapper productMapper;
    private final TagDefinitionRepository tagDefinitionRepository;

    // ==================== GET PRODUCTS ====================
    @Override
    public Page<ProductSummaryResponse> getProducts(ProductFilterRequest request) {
        Specification<Product> spec = buildSpec(request);
        String sortBy = request.getSortBy();

        if ("price_asc".equals(sortBy) || "price_desc".equals(sortBy)) {
            Pageable pageable = PageRequest.of(request.getPage(), request.getSize());
            Page<Product> page = "price_asc".equals(sortBy)
                    ? productRepository.findAllOrderByMinPriceAsc(pageable)
                    : productRepository.findAllOrderByMinPriceDesc(pageable);
            return page.map(this::toSummary);
        }

        Sort sort = buildSort(sortBy);
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);
        return productRepository.findAll(spec, pageable).map(this::toSummary);
    }

    // ==================== GET PRODUCT DETAIL ====================
    @Override
    public ProductDetailResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndIsActiveTrue(slug)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        List<ProductVariant> variants = variantRepository
                .findAllByProductIdAndIsActiveTrueOrderBySortOrderAsc(product.getId());

        List<ProductImage> images = imageRepository
                .findAllByProductIdOrderBySortOrderAsc(product.getId());

        List<String> imageUrls = images.stream().map(ProductImage::getImageUrl).toList();
        List<String> tags = product.getTags() != null
                ? product.getTags().stream().map(ProductTag::getTag).toList()
                : List.of();

        List<ProductSummaryResponse> related = productRepository
                .findByCategoryIdAndIsActiveTrueAndIdNot(
                        product.getCategory().getId(),
                        product.getId(),
                        PageRequest.of(0, 16))
                .stream()
                .map(this::toSummary)
                .toList();

        return productMapper.toDetail(product, variants, imageUrls, tags, related);
    }

    // ==================== GET CATEGORIES / FLAVORS / SIZES ====================
    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByIsActiveTrueOrderBySortOrderAsc()
                .stream().map(productMapper::toCategory).toList();
    }

    @Override
    public List<FlavorResponse> getAllFlavors() {
        return flavorRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream().map(productMapper::toFlavor).toList();
    }

    @Override
    public List<SizeResponse> getAllSizes() {
        return sizeRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream().map(productMapper::toSize).toList();
    }
    @Override
    public List<TagDefinitionResponse> getAllTags() {
        return tagDefinitionRepository.findAllByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(t -> new TagDefinitionResponse(t.getId(), t.getName(), t.getName()))
                .toList();
    }
    // ==================== HELPER: toSummary ====================
    // Service tự query variants + images, rồi tính toán
    // Mapper sẽ KHÔNG gọi DB — chỉ nhận data đã sẵn
    private ProductSummaryResponse toSummary(Product product) {
        List<ProductVariant> variants = variantRepository
                .findAllByProductIdAndIsActiveTrueOrderBySortOrderAsc(product.getId());
        List<ProductImage> images = imageRepository
                .findAllByProductIdOrderBySortOrderAsc(product.getId());

        return productMapper.toSummary(product, variants, images);
    }



    // ==================== SPEC ====================
    private Specification<Product> buildSpec(ProductFilterRequest req) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            predicates.add(cb.isTrue(root.get("isActive")));

            if (req.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), req.getCategoryId()));
            }

            if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
                String kw = "%" + req.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), kw),
                        cb.like(cb.lower(root.get("category").get("name")), kw)
                ));
            }

            if (req.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), req.getMinRating()));
            }

            if (req.getTags() != null && !req.getTags().isBlank()) {
                List<String> tagList = Arrays.asList(req.getTags().split(","));
                var tagJoin = root.join("tags", JoinType.INNER);
                predicates.add(tagJoin.get("tag").in(tagList));
                query.distinct(true);
            }

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

                if (req.getFlavorIds() != null && !req.getFlavorIds().isEmpty()) {
                    predicates.add(v.get("flavor").get("id").in(req.getFlavorIds()));
                }
                if (req.getSizeIds() != null && !req.getSizeIds().isEmpty()) {
                    predicates.add(v.get("size").get("id").in(req.getSizeIds()));
                }
                if (req.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(v.get("salePrice"), req.getMinPrice()));
                }
                if (req.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(v.get("salePrice"), req.getMaxPrice()));
                }
                if (Boolean.TRUE.equals(req.getInStock())) {
                    predicates.add(cb.greaterThan(v.get("stockQty"), 0));
                }
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
}