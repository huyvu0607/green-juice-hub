package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.product.request.ProductFilterRequest;
import com.greenjuicehub.backend.dto.product.response.*;
import com.greenjuicehub.backend.service.product.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final IProductService productService;

    @GetMapping("/tags")
    public ResponseEntity<List<TagDefinitionResponse>> getAllTags() {
        return ResponseEntity.ok(productService.getAllTags());
    }

    @GetMapping
    public ResponseEntity<Page<ProductSummaryResponse>> getProducts(
            ProductFilterRequest request) {
        return ResponseEntity.ok(productService.getProducts(request));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProductDetailResponse> getProductBySlug(
            @PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @GetMapping("/flavors")
    public ResponseEntity<List<FlavorResponse>> getFlavors() {
        return ResponseEntity.ok(productService.getAllFlavors());
    }

    @GetMapping("/sizes")
    public ResponseEntity<List<SizeResponse>> getSizes() {
        return ResponseEntity.ok(productService.getAllSizes());
    }

    @GetMapping("/deal-categories")
    public ResponseEntity<List<CategoryResponse>> getDealCategories() {
        return ResponseEntity.ok(productService.getDealCategories());
    }
}