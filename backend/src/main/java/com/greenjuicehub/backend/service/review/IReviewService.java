package com.greenjuicehub.backend.service.review;

import com.greenjuicehub.backend.dto.review.request.CreateReviewRequest;
import com.greenjuicehub.backend.dto.review.response.ProductRatingResponse;
import com.greenjuicehub.backend.dto.review.response.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IReviewService {
    ReviewResponse createReview(Long userId, CreateReviewRequest request);
    Page<ReviewResponse> getProductReviews(Long productId, Integer rating, Pageable pageable);
    boolean hasReviewed(Long userId, Long orderId, Long productId);
    ProductRatingResponse getProductRating(Long productId);


    // Admin/Staff
    Page<ReviewResponse> getPendingReviews(Pageable pageable);
    ReviewResponse approveReview(Long reviewId);
    ReviewResponse rejectReview(Long reviewId);

}