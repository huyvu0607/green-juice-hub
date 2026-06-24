package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.PageResponse;
import com.greenjuicehub.backend.dto.review.response.ReviewResponse;
import com.greenjuicehub.backend.service.review.IReviewService;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class AdminReviewController {

    private final IReviewService reviewService;

    /** GET /api/admin/reviews?isApproved=&rating=&page=&size= */
    @GetMapping
    public ResponseEntity<PageResponse<ReviewResponse>> getAllReviews(
            @RequestParam(required = false) Boolean isApproved,
            @RequestParam(required = false) Integer rating,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                PageResponse.from(reviewService.getAllReviews(isApproved, rating, pageable))
        );    }

    /** PATCH /api/admin/reviews/{id}/toggle — bật/tắt hiển thị */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ReviewResponse> toggleApprove(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.toggleApprove(id));
    }

    /** DELETE /api/admin/reviews/{id} — xoá hẳn */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.rejectReview(id);
        return ResponseEntity.noContent().build();
    }

    /** POST /api/admin/reviews/{id}/reply — phản hồi (hoặc xoá reply nếu body rỗng) */
    @PostMapping("/{id}/reply")
    public ResponseEntity<ReviewResponse> replyReview(
            @PathVariable Long id,
            @RequestBody ReplyRequest body) {
        return ResponseEntity.ok(reviewService.replyReview(id, body.getReply()));
    }

    @Data
    static class ReplyRequest {
        private String reply; // nullable — gửi rỗng để xoá reply
    }
}