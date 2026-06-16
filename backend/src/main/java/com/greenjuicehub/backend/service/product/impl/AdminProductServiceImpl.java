package com.greenjuicehub.backend.service.product.impl;

import com.greenjuicehub.backend.dto.adminProduct.request.*;
import com.greenjuicehub.backend.dto.adminProduct.response.*;
import com.greenjuicehub.backend.dto.product.response.CategoryResponse;
import com.greenjuicehub.backend.dto.product.response.FlavorResponse;
import com.greenjuicehub.backend.dto.product.response.SizeResponse;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.ProductMapper;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.product.IAdminProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminProductServiceImpl implements IAdminProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final CategoryRepository categoryRepository;
    private final FlavorRepository flavorRepository;
    private final SizeRepository sizeRepository;
    private final ProductMapper productMapper;

    // ══════════════════════════════════════════════════════════════════════════
    // PRODUCTS
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public Page<AdminProductRowResponse> getProductsForAdmin(String keyword, Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return productRepository.findAllForAdmin(kw, categoryId, pageable).map(this::toRow);
    }

    @Override
    public AdminProductDetailResponse getProductById(Long id) {
        return toAdminDetail(findProductOrThrow(id));
    }

    @Override
    @Transactional
    public AdminProductDetailResponse createProduct(SaveProductRequest request) {
        Category category = findCategoryOrThrow(request.getCategoryId());
        String slug = generateUniqueSlug(request.getName(), null);

        Product product = Product.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .category(category)
                .avgRating(0f)
                .reviewCount(0)
                .isActive(true)
                .build();

        product = productRepository.save(product);
        saveImages(product, request.getImages());
        saveTags(product, request.getTags());

        return toAdminDetail(productRepository.findById(product.getId()).orElseThrow());
    }

    @Override
    @Transactional
    public AdminProductDetailResponse updateProduct(Long id, SaveProductRequest request) {
        Product product = findProductOrThrow(id);
        Category category = findCategoryOrThrow(request.getCategoryId());

        product.setName(request.getName());
        product.setSlug(generateUniqueSlug(request.getName(), id));
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product = productRepository.save(product);

        if (request.getImages() != null) {
            imageRepository.deleteAll(imageRepository.findAllByProductIdOrderBySortOrderAsc(product.getId()));
            saveImages(product, request.getImages());
        }

        if (request.getTags() != null) {
            product.getTags().clear();
            productRepository.save(product);
            saveTags(product, request.getTags());
        }

        return toAdminDetail(productRepository.findById(product.getId()).orElseThrow());
    }

    @Override
    @Transactional
    public void toggleProductActive(Long id) {
        Product product = findProductOrThrow(id);
        product.setIsActive(!product.getIsActive());
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        // Soft delete — giữ lịch sử đơn hàng
        Product product = findProductOrThrow(id);
        product.setIsActive(false);
        productRepository.save(product);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VARIANTS
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    @Transactional
    public AdminVariantResponse createVariant(Long productId, SaveVariantRequest request) {
        Product product = findProductOrThrow(productId);
        return toAdminVariant(variantRepository.save(buildVariant(request, product)));
    }

    @Override
    @Transactional
    public AdminVariantResponse updateVariant(Long variantId, SaveVariantRequest request) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Biến thể không tồn tại"));

        variant.setFlavor(request.getFlavorId() != null
                ? flavorRepository.findById(request.getFlavorId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Flavor không tồn tại"))
                : null);
        variant.setSize(request.getSizeId() != null
                ? sizeRepository.findById(request.getSizeId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Size không tồn tại"))
                : null);
        variant.setOriginalPrice(request.getOriginalPrice());
        variant.setSalePrice(request.getSalePrice());
        variant.setDiscountPercent(calcDiscount(request.getOriginalPrice(), request.getSalePrice()));
        variant.setStockQty(request.getStockQty());
        variant.setWeightGram(request.getWeightGram() != null ? request.getWeightGram() : 500);
        variant.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        variant.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        return toAdminVariant(variantRepository.save(variant));
    }

    @Override
    @Transactional
    public void deleteVariant(Long variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Biến thể không tồn tại"));
        variant.setIsActive(false);
        variantRepository.save(variant);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CATEGORIES
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public List<CategoryResponse> getAllCategoriesForAdmin() {
        return categoryRepository.findAll(Sort.by("sortOrder")).stream()
                .map(productMapper::toCategory).toList();
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(SaveCategoryRequest request) {
        String slug = toSlug(request.getName());
        if (categoryRepository.existsBySlug(slug)) slug = slug + "-" + System.currentTimeMillis();

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return productMapper.toCategory(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, SaveCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Danh mục không tồn tại"));
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());
        return productMapper.toCategory(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void toggleCategoryActive(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Danh mục không tồn tại"));
        category.setIsActive(!category.getIsActive());
        categoryRepository.save(category);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FLAVORS
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public List<FlavorResponse> getAllFlavorsForAdmin() {
        return flavorRepository.findAll(Sort.by("name")).stream()
                .map(productMapper::toFlavor).toList();
    }

    @Override
    @Transactional
    public FlavorResponse createFlavor(SaveFlavorRequest request) {
        return productMapper.toFlavor(flavorRepository.save(
                Flavor.builder()
                        .name(request.getName())
                        .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                        .build()));
    }

    @Override
    @Transactional
    public FlavorResponse updateFlavor(Long id, SaveFlavorRequest request) {
        Flavor flavor = flavorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Flavor không tồn tại"));
        flavor.setName(request.getName());
        if (request.getIsActive() != null) flavor.setIsActive(request.getIsActive());
        return productMapper.toFlavor(flavorRepository.save(flavor));
    }

    @Override
    @Transactional
    public void toggleFlavorActive(Long id) {
        Flavor flavor = flavorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Flavor không tồn tại"));
        flavor.setIsActive(!flavor.getIsActive());
        flavorRepository.save(flavor);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SIZES
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public List<SizeResponse> getAllSizesForAdmin() {
        return sizeRepository.findAll(Sort.by("name")).stream()
                .map(productMapper::toSize).toList();
    }

    @Override
    @Transactional
    public SizeResponse createSize(SaveSizeRequest request) {
        return productMapper.toSize(sizeRepository.save(
                Size.builder()
                        .name(request.getName())
                        .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                        .build()));
    }

    @Override
    @Transactional
    public SizeResponse updateSize(Long id, SaveSizeRequest request) {
        Size size = sizeRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Size không tồn tại"));
        size.setName(request.getName());
        if (request.getIsActive() != null) size.setIsActive(request.getIsActive());
        return productMapper.toSize(sizeRepository.save(size));
    }

    @Override
    @Transactional
    public void toggleSizeActive(Long id) {
        Size size = sizeRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Size không tồn tại"));
        size.setIsActive(!size.getIsActive());
        sizeRepository.save(size);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
    }

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Danh mục không tồn tại"));
    }

    private void saveImages(Product product, List<SaveProductRequest.ProductImageRequest> imageRequests) {
        if (imageRequests == null || imageRequests.isEmpty()) return;
        imageRepository.saveAll(imageRequests.stream()
                .map(r -> ProductImage.builder()
                        .product(product)
                        .imageUrl(r.getImageUrl())
                        .isPrimary(r.getIsPrimary() != null ? r.getIsPrimary() : false)
                        .sortOrder(r.getSortOrder() != null ? r.getSortOrder() : 0)
                        .build())
                .toList());
    }

    private void saveTags(Product product, List<String> tags) {
        if (tags == null || tags.isEmpty()) return;
        product.getTags().addAll(tags.stream()
                .map(t -> ProductTag.builder().product(product).tag(t.trim().toLowerCase()).build())
                .toList());
        productRepository.save(product);
    }

    private ProductVariant buildVariant(SaveVariantRequest request, Product product) {
        return ProductVariant.builder()
                .product(product)
                .flavor(request.getFlavorId() != null
                        ? flavorRepository.findById(request.getFlavorId())
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Flavor không tồn tại"))
                        : null)
                .size(request.getSizeId() != null
                        ? sizeRepository.findById(request.getSizeId())
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Size không tồn tại"))
                        : null)
                .originalPrice(request.getOriginalPrice())
                .salePrice(request.getSalePrice())
                .discountPercent(calcDiscount(request.getOriginalPrice(), request.getSalePrice()))
                .stockQty(request.getStockQty())
                .weightGram(request.getWeightGram() != null ? request.getWeightGram() : 500)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    private BigDecimal calcDiscount(BigDecimal original, BigDecimal sale) {
        if (original == null || sale == null || original.compareTo(BigDecimal.ZERO) == 0)
            return BigDecimal.ZERO;
        return original.subtract(sale)
                .multiply(BigDecimal.valueOf(100))
                .divide(original, 2, RoundingMode.HALF_UP)
                .max(BigDecimal.ZERO);
    }

    private String generateUniqueSlug(String name, Long excludeId) {
        String base = toSlug(name);
        String slug = base;
        int count = 1;
        while (excludeId == null
                ? productRepository.existsBySlug(slug)
                : productRepository.existsBySlugAndIdNot(slug, excludeId)) {
            slug = base + "-" + count++;
        }
        return slug;
    }

    private String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized)
                .replaceAll("")
                .toLowerCase()
                .replace("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private AdminProductRowResponse toRow(Product product) {
        List<ProductVariant> variants = variantRepository
                .findAllByProductIdAndIsActiveTrueOrderBySortOrderAsc(product.getId());
        List<ProductImage> images = imageRepository
                .findAllByProductIdOrderBySortOrderAsc(product.getId());

        String primaryImage = images.stream().filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl).findFirst()
                .orElse(images.isEmpty() ? null : images.get(0).getImageUrl());

        return AdminProductRowResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .primaryImage(primaryImage)
                .categoryName(product.getCategory().getName())
                .variantCount(variants.size())
                .totalStock(variants.stream().mapToInt(ProductVariant::getStockQty).sum())
                .minSalePrice(variants.stream().map(ProductVariant::getSalePrice)
                        .min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO))
                .maxDiscountPercent(variants.stream().map(ProductVariant::getDiscountPercent)
                        .max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO))
                .avgRating(product.getAvgRating())
                .reviewCount(product.getReviewCount())
                .isActive(product.getIsActive())
                .createdAt(product.getCreatedAt())
                .build();
    }

    private AdminProductDetailResponse toAdminDetail(Product product) {
        List<ProductVariant> variants = variantRepository
                .findAllByProductIdAndIsActiveTrueOrderBySortOrderAsc(product.getId());
        List<ProductImage> images = imageRepository
                .findAllByProductIdOrderBySortOrderAsc(product.getId());
        List<String> tags = product.getTags() != null
                ? product.getTags().stream().map(ProductTag::getTag).toList() : List.of();

        return AdminProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .avgRating(product.getAvgRating())
                .reviewCount(product.getReviewCount())
                .isActive(product.getIsActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .category(productMapper.toCategory(product.getCategory()))
                .images(images.stream().map(i -> AdminProductImageResponse.builder()
                        .id(i.getId()).imageUrl(i.getImageUrl())
                        .isPrimary(i.getIsPrimary()).sortOrder(i.getSortOrder())
                        .build()).toList())
                .tags(tags)
                .variants(variants.stream().map(this::toAdminVariant).toList())
                .build();
    }

    private AdminVariantResponse toAdminVariant(ProductVariant v) {
        return AdminVariantResponse.builder()
                .id(v.getId())
                .flavor(v.getFlavor() != null ? productMapper.toFlavor(v.getFlavor()) : null)
                .size(v.getSize() != null ? productMapper.toSize(v.getSize()) : null)
                .originalPrice(v.getOriginalPrice())
                .salePrice(v.getSalePrice())
                .discountPercent(v.getDiscountPercent())
                .stockQty(v.getStockQty())
                .weightGram(v.getWeightGram())
                .sortOrder(v.getSortOrder())
                .isActive(v.getIsActive())
                .build();
    }
}