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

    // Admin / Staff
    Page<ReviewResponse> getAllReviews(Boolean isApproved, Integer rating, Pageable pageable);
    Page<ReviewResponse> getPendingReviews(Pageable pageable);
    ReviewResponse toggleApprove(Long reviewId);   // bật/tắt thay vì approve/reject riêng
    ReviewResponse rejectReview(Long reviewId);    // xoá hẳn
    ReviewResponse replyReview(Long reviewId, String reply); // phản hồi
}