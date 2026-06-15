// dto/order/request/AdminUpdateOrderStatusRequest.java
package com.greenjuicehub.backend.dto.adminOrder.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateOrderStatusRequest {
    private String status;        // CONFIRMED | SHIPPING | DELIVERED | CANCELLED
    private String cancelReason;  // chỉ cần khi status = CANCELLED
}