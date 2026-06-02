package com.greenjuicehub.backend.service.product;

import com.greenjuicehub.backend.dto.product.request.ProductFilterRequest;
import com.greenjuicehub.backend.dto.product.response.*;
import org.springframework.data.domain.Page;
import java.util.List;

public interface IProductService {
    Page<ProductSummaryResponse> getProducts(ProductFilterRequest request);
    ProductDetailResponse getProductBySlug(String slug);
    List<CategoryResponse> getAllCategories();
    List<FlavorResponse> getAllFlavors();
    List<SizeResponse> getAllSizes();
}