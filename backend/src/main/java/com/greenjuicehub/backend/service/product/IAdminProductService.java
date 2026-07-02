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

    Page<AdminProductRowResponse> getProductsForAdmin(
            String keyword, Long categoryId, Boolean isActive, String stock, String tag,
            Boolean isDeleted, int page, int size);

    AdminProductDetailResponse getProductById(Long id);

    AdminProductDetailResponse createProduct(SaveProductRequest request);

    AdminProductDetailResponse updateProduct(Long id, SaveProductRequest request);

    void toggleProductActive(Long id);

    // Soft delete: set isDeleted = true + isActive = false
    void deleteProduct(Long id);

    // Khôi phục sản phẩm đã xóa: set isDeleted = false
    void restoreProduct(Long id);

    // ── Variants ──────────────────────────────────────────────────────────────

    AdminVariantResponse createVariant(Long productId, SaveVariantRequest request);

    AdminVariantResponse updateVariant(Long variantId, SaveVariantRequest request);

    void deleteVariant(Long variantId);

    // ── Categories ────────────────────────────────────────────────────────────

    List<CategoryResponse> getAllCategoriesForAdmin();

    CategoryResponse createCategory(SaveCategoryRequest request);

    CategoryResponse updateCategory(Long id, SaveCategoryRequest request);

    void toggleCategoryActive(Long id);
    void deleteCategory(Long id);


    // ── Flavors ───────────────────────────────────────────────────────────────

    List<FlavorResponse> getAllFlavorsForAdmin();

    FlavorResponse createFlavor(SaveFlavorRequest request);

    FlavorResponse updateFlavor(Long id, SaveFlavorRequest request);

    void toggleFlavorActive(Long id);
    void deleteFlavor(Long id);


    // ── Sizes ─────────────────────────────────────────────────────────────────

    List<SizeResponse> getAllSizesForAdmin();

    SizeResponse createSize(SaveSizeRequest request);

    SizeResponse updateSize(Long id, SaveSizeRequest request);

    void toggleSizeActive(Long id);
    void deleteSize(Long id);

}