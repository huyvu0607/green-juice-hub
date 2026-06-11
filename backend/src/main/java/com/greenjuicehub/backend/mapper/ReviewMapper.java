package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.review.response.ProductRatingResponse;
import com.greenjuicehub.backend.dto.review.response.ReviewResponse;
import com.greenjuicehub.backend.entity.Review;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ReviewMapper {

    public ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .orderId(review.getOrder().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .imageUrl(review.getImageUrl())
                .isApproved(review.getIsApproved())
                .createdAt(review.getCreatedAt())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .userAvatar(review.getUser().getAvatarUrl())
                .build();
    }

    public ProductRatingResponse toRatingResponse(
            Double avg,
            Integer total,
            List<Object[]> distributionRows) {

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);

        distributionRows.forEach(row ->
                distribution.put(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).longValue()
                )
        );

        return ProductRatingResponse.builder()
                .avgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalReviews(total != null ? total : 0)
                .distribution(distribution)
                .build();
    }
}