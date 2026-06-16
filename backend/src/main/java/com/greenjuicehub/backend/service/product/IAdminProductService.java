package com.greenjuicehub.backend.service.product;

import com.greenjuicehub.backend.dto.adminProduct.request.*;
import com.greenjuicehub.backend.dto.adminProduct.response.*;
import com.greenjuicehub.backend.dto.product.response.CategoryResponse;
import com.greenjuicehub.backend.dto.product.response.FlavorResponse;
import com.greenjuicehub.backend.dto.product.response.SizeResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IAdminProductService {

    // ── Products ──────────────────────────────────────────────────────────────
    Page<AdminProductRowResponse> getProductsForAdmin(String keyword, Long categoryId, Boolean isActive, String stock, String tag, int page, int size);    AdminProductDetailResponse getProductById(Long id);
    AdminProductDetailResponse createProduct(SaveProductRequest request);
    AdminProductDetailResponse updateProduct(Long id, SaveProductRequest request);
    void toggleProductActive(Long id);
    void deleteProduct(Long id);

    // ── Variants ──────────────────────────────────────────────────────────────
    AdminVariantResponse createVariant(Long productId, SaveVariantRequest request);
    AdminVariantResponse updateVariant(Long variantId, SaveVariantRequest request);
    void deleteVariant(Long variantId);

    // ── Categories ────────────────────────────────────────────────────────────
    List<CategoryResponse> getAllCategoriesForAdmin();
    CategoryResponse createCategory(SaveCategoryRequest request);
    CategoryResponse updateCategory(Long id, SaveCategoryRequest request);
    void toggleCategoryActive(Long id);

    // ── Flavors ───────────────────────────────────────────────────────────────
    List<FlavorResponse> getAllFlavorsForAdmin();
    FlavorResponse createFlavor(SaveFlavorRequest request);
    FlavorResponse updateFlavor(Long id, SaveFlavorRequest request);
    void toggleFlavorActive(Long id);

    // ── Sizes ─────────────────────────────────────────────────────────────────
    List<SizeResponse> getAllSizesForAdmin();
    SizeResponse createSize(SaveSizeRequest request);
    SizeResponse updateSize(Long id, SaveSizeRequest request);
    void toggleSizeActive(Long id);
}