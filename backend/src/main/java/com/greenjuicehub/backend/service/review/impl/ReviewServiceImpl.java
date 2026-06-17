package com.greenjuicehub.backend.service.review.impl;

import com.greenjuicehub.backend.dto.review.request.CreateReviewRequest;
import com.greenjuicehub.backend.dto.review.response.ProductRatingResponse;
import com.greenjuicehub.backend.dto.review.response.ReviewResponse;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.ReviewMapper;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.review.IReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements IReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;

    // ── Customer ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ReviewResponse createReview(Long userId, CreateReviewRequest request) {
        Order order = orderRepository.findByIdAndUserId(request.getOrderId(), userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));

        if (order.getStatus() != Order.OrderStatus.DELIVERED) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể đánh giá sau khi đơn hàng đã được giao thành công");
        }

        if (reviewRepository.existsByProductIdAndUserIdAndOrderId(
                request.getProductId(), userId, request.getOrderId())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi");
        }

        boolean productInOrder = orderItemRepository
                .findAllByOrderIdWithDetails(request.getOrderId())
                .stream()
                .anyMatch(item -> item.getProduct().getId().equals(request.getProductId()));

        if (!productInOrder) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Sản phẩm này không có trong đơn hàng");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        Review review = Review.builder()
                .product(product)
                .user(user)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment())
                .imageUrl(request.getImageUrl())
                .productName(product.getName()) // snapshot tên sản phẩm
                .isApproved(true)               // tự duyệt luôn
                .build();

        Review saved = reviewRepository.save(review);
        updateProductRating(product.getId());
        return reviewMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(Long productId, Integer rating, Pageable pageable) {
        return reviewRepository
                .findByProductIdAndRating(productId, rating, pageable)
                .map(reviewMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasReviewed(Long userId, Long orderId, Long productId) {
        return reviewRepository.existsByProductIdAndUserIdAndOrderId(productId, userId, orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductRatingResponse getProductRating(Long productId) {
        return reviewMapper.toRatingResponse(
                reviewRepository.calculateAvgRating(productId),
                reviewRepository.countApprovedByProductId(productId),
                reviewRepository.countRatingDistribution(productId)
        );
    }

    // ── Admin / Staff ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllReviews(Boolean isApproved, Integer rating, Pageable pageable) {
        return reviewRepository
                .findAllForAdmin(isApproved, rating, pageable)
                .map(reviewMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getPendingReviews(Pageable pageable) {
        return reviewRepository
                .findByIsApprovedFalseOrderByCreatedAtDesc(pageable)
                .map(reviewMapper::toResponse);
    }

    /** Toggle bật/tắt hiển thị review, cập nhật lại rating sản phẩm */
    @Override
    @Transactional
    public ReviewResponse toggleApprove(Long reviewId) {
        Review review = findOrThrow(reviewId);
        review.setIsApproved(!review.getIsApproved());
        review = reviewRepository.save(review);
        updateProductRating(review.getProduct().getId());
        return reviewMapper.toResponse(review);
    }

    /** Xoá hẳn khỏi DB */
    @Override
    @Transactional
    public ReviewResponse rejectReview(Long reviewId) {
        Review review = findOrThrow(reviewId);
        boolean wasApproved = Boolean.TRUE.equals(review.getIsApproved());
        Long productId = review.getProduct().getId();

        ReviewResponse response = reviewMapper.toResponse(review);
        reviewRepository.delete(review);

        if (wasApproved) updateProductRating(productId);
        return response;
    }

    /** Phản hồi từ Admin/Staff — hiển thị là "Quản trị viên" phía user */
    @Override
    @Transactional
    public ReviewResponse replyReview(Long reviewId, String reply) {
        Review review = findOrThrow(reviewId);

        if (reply == null || reply.isBlank()) {
            // Xoá reply nếu gửi rỗng
            review.setReply(null);
            review.setRepliedAt(null);
        } else {
            review.setReply(reply.trim());
            review.setRepliedAt(LocalDateTime.now());
        }

        review = reviewRepository.save(review);
        return reviewMapper.toResponse(review);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Review findOrThrow(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));
    }

    private void updateProductRating(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));

        Double avg = reviewRepository.calculateAvgRating(productId);
        Integer count = reviewRepository.countApprovedByProductId(productId);

        product.setAvgRating(avg != null ? (float) (Math.round(avg * 10.0) / 10.0) : 0.0f);
        product.setReviewCount(count != null ? count : 0);
        productRepository.save(product);
    }
}