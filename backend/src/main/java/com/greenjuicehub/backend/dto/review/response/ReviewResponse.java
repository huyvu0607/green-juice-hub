package com.greenjuicehub.backend.dto.review.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@Builder
@NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long productId;
    private String productName;   // tên sản phẩm thay vì chỉ ID
    private Long orderId;
    private String orderCode;     // mã đơn dễ đọc hơn orderId
    private Byte rating;
    private String comment;
    private String imageUrl;
    private Boolean isApproved;
    private LocalDateTime createdAt;

    // Phản hồi từ Admin/Staff
    private String reply;
    private LocalDateTime repliedAt;

    // User info
    private Long userId;
    private String userName;
    private String userAvatar;
}