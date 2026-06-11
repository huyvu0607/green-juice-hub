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

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements IReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository; // thêm
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReviewMapper reviewMapper;

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

        // Fix bước 4: dùng OrderItemRepository thay vì order.getOrderItems()
        boolean productInOrder = orderItemRepository
                .findAllByOrderIdWithDetails(request.getOrderId())
                .stream()
                .anyMatch(item -> item.getProduct().getId().equals(request.getProductId()));

        if (!productInOrder) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Sản phẩm này không có trong đơn hàng");
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
                .isApproved(true)
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

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByIsApprovedFalseOrderByCreatedAtDesc(pageable)
                .map(reviewMapper::toResponse);
    }

    @Override
    @Transactional
    public ReviewResponse approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));

        review.setIsApproved(true);
        review = reviewRepository.save(review);
        updateProductRating(review.getProduct().getId());

        return reviewMapper.toResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse rejectReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));

        boolean wasApproved = Boolean.TRUE.equals(review.getIsApproved());
        review.setIsApproved(false);
        review = reviewRepository.save(review);

        if (wasApproved) {
            updateProductRating(review.getProduct().getId());
        }

        return reviewMapper.toResponse(review);
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