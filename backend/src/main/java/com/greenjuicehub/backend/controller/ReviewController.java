package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.review.request.CreateReviewRequest;
import com.greenjuicehub.backend.dto.review.response.ProductRatingResponse;
import com.greenjuicehub.backend.dto.review.response.ReviewResponse;
import com.greenjuicehub.backend.service.review.IReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final IReviewService reviewService;

    // ── Customer ─────────────────────────────────────────────────────────────

    @PostMapping("/api/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(userId, request));
    }

    @GetMapping("/api/reviews/check")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Boolean> hasReviewed(
            @AuthenticationPrincipal Long userId,
            @RequestParam Long orderId,
            @RequestParam Long productId) {
        return ResponseEntity.ok(reviewService.hasReviewed(userId, orderId, productId));
    }

    // ── Public ───────────────────────────────────────────────────────────────

    @GetMapping("/api/reviews/product/{productId}")
    public ResponseEntity<Page<ReviewResponse>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(required = false) Integer rating,
            @PageableDefault(size = 5, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId, rating, pageable));
    }

    @GetMapping("/api/reviews/product/{productId}/rating")
    public ResponseEntity<ProductRatingResponse> getProductRating(
            @PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductRating(productId));
    }

    // ── Admin / Staff ─────────────────────────────────────────────────────────

    @GetMapping("/api/admin/reviews/pending")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<ReviewResponse>> getPendingReviews(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(reviewService.getPendingReviews(pageable));
    }

    @PatchMapping("/api/admin/reviews/{id}/approve")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ReviewResponse> approveReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.approveReview(id));
    }

    @PatchMapping("/api/admin/reviews/{id}/reject")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ReviewResponse> rejectReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.rejectReview(id));
    }
}