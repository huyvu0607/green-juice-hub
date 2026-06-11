package com.greenjuicehub.backend.dto.review.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long productId;
    private Long orderId;
    private Byte rating;
    private String comment;
    private String imageUrl;
    private Boolean isApproved;
    private LocalDateTime createdAt;

    // User info
    private Long userId;
    private String userName;
    private String userAvatar;
}