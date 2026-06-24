    package com.greenjuicehub.backend.controller;

    import com.greenjuicehub.backend.dto.PageResponse;
    import com.greenjuicehub.backend.dto.adminProduct.request.*;
    import com.greenjuicehub.backend.dto.adminProduct.response.*;
    import com.greenjuicehub.backend.dto.product.response.CategoryResponse;
    import com.greenjuicehub.backend.dto.product.response.FlavorResponse;
    import com.greenjuicehub.backend.dto.product.response.SizeResponse;
    import com.greenjuicehub.backend.service.product.IAdminProductService;
    import jakarta.validation.Valid;
    import lombok.RequiredArgsConstructor;
    import org.springframework.data.domain.Page;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.security.access.prepost.PreAuthorize;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @RequestMapping("/api/admin/products")
    @RequiredArgsConstructor
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public class AdminProductController {

        private final IAdminProductService adminProductService;

        // ── Products ──────────────────────────────────────────────────────────────

        @GetMapping
        public ResponseEntity<PageResponse<AdminProductRowResponse>> getProducts(
                @RequestParam(required = false) String keyword,
                @RequestParam(required = false) Long categoryId,
                @RequestParam(required = false) Boolean isActive,
                @RequestParam(required = false) String stock,
                @RequestParam(required = false) String tag,
                @RequestParam(defaultValue = "0") int page,
                @RequestParam(defaultValue = "20") int size) {
            return ResponseEntity.ok(
                    PageResponse.from(adminProductService.getProductsForAdmin(keyword, categoryId, isActive, stock, tag, page, size))
            );
        }

        @GetMapping("/{id}")
        public ResponseEntity<AdminProductDetailResponse> getProduct(@PathVariable Long id) {
            return ResponseEntity.ok(adminProductService.getProductById(id));
        }

        @PostMapping
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AdminProductDetailResponse> createProduct(
                @Valid @RequestBody SaveProductRequest request) {
            return ResponseEntity.status(HttpStatus.CREATED).body(adminProductService.createProduct(request));
        }

        @PutMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AdminProductDetailResponse> updateProduct(
                @PathVariable Long id,
                @Valid @RequestBody SaveProductRequest request) {
            return ResponseEntity.ok(adminProductService.updateProduct(id, request));
        }

        @PatchMapping("/{id}/toggle-active")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> toggleActive(@PathVariable Long id) {
            adminProductService.toggleProductActive(id);
            return ResponseEntity.noContent().build();
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
            adminProductService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        }

        // ── Variants ──────────────────────────────────────────────────────────────

        @PostMapping("/{productId}/variants")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AdminVariantResponse> createVariant(
                @PathVariable Long productId,
                @Valid @RequestBody SaveVariantRequest request) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(adminProductService.createVariant(productId, request));
        }

        @PutMapping("/variants/{variantId}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AdminVariantResponse> updateVariant(
                @PathVariable Long variantId,
                @Valid @RequestBody SaveVariantRequest request) {
            return ResponseEntity.ok(adminProductService.updateVariant(variantId, request));
        }

        @DeleteMapping("/variants/{variantId}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> deleteVariant(@PathVariable Long variantId) {
            adminProductService.deleteVariant(variantId);
            return ResponseEntity.noContent().build();
        }

        // ── Categories ────────────────────────────────────────────────────────────

        @GetMapping("/categories")
        public ResponseEntity<List<CategoryResponse>> getCategories() {
            return ResponseEntity.ok(adminProductService.getAllCategoriesForAdmin());
        }

        @PostMapping("/categories")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<CategoryResponse> createCategory(
                @Valid @RequestBody SaveCategoryRequest request) {
            return ResponseEntity.status(HttpStatus.CREATED).body(adminProductService.createCategory(request));
        }

        @PutMapping("/categories/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<CategoryResponse> updateCategory(
                @PathVariable Long id,
                @Valid @RequestBody SaveCategoryRequest request) {
            return ResponseEntity.ok(adminProductService.updateCategory(id, request));
        }

        @PatchMapping("/categories/{id}/toggle-active")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> toggleCategoryActive(@PathVariable Long id) {
            adminProductService.toggleCategoryActive(id);
            return ResponseEntity.noContent().build();
        }

        // ── Flavors ───────────────────────────────────────────────────────────────

        @GetMapping("/flavors")
        public ResponseEntity<List<FlavorResponse>> getFlavors() {
            return ResponseEntity.ok(adminProductService.getAllFlavorsForAdmin());
        }

        @PostMapping("/flavors")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<FlavorResponse> createFlavor(
                @Valid @RequestBody SaveFlavorRequest request) {
            return ResponseEntity.status(HttpStatus.CREATED).body(adminProductService.createFlavor(request));
        }

        @PutMapping("/flavors/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<FlavorResponse> updateFlavor(
                @PathVariable Long id,
                @Valid @RequestBody SaveFlavorRequest request) {
            return ResponseEntity.ok(adminProductService.updateFlavor(id, request));
        }

        @PatchMapping("/flavors/{id}/toggle-active")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> toggleFlavorActive(@PathVariable Long id) {
            adminProductService.toggleFlavorActive(id);
            return ResponseEntity.noContent().build();
        }

        // ── Sizes ─────────────────────────────────────────────────────────────────

        @GetMapping("/sizes")
        public ResponseEntity<List<SizeResponse>> getSizes() {
            return ResponseEntity.ok(adminProductService.getAllSizesForAdmin());
        }

        @PostMapping("/sizes")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<SizeResponse> createSize(
                @Valid @RequestBody SaveSizeRequest request) {
            return ResponseEntity.status(HttpStatus.CREATED).body(adminProductService.createSize(request));
        }

        @PutMapping("/sizes/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<SizeResponse> updateSize(
                @PathVariable Long id,
                @Valid @RequestBody SaveSizeRequest request) {
            return ResponseEntity.ok(adminProductService.updateSize(id, request));
        }

        @PatchMapping("/sizes/{id}/toggle-active")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> toggleSizeActive(@PathVariable Long id) {
            adminProductService.toggleSizeActive(id);
            return ResponseEntity.noContent().build();
        }
    }