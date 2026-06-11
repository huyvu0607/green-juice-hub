package com.greenjuicehub.backend.dto.review.response;

import lombok.*;
import java.util.Map;

@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class ProductRatingResponse {
    private Double avgRating;
    private Integer totalReviews;
    private Map<Integer, Long> distribution; // { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
}