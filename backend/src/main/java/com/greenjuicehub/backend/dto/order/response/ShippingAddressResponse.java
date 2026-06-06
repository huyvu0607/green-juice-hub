package com.greenjuicehub.backend.dto.order.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingAddressResponse {

    private String fullName;
    private String phone;
    private String province;
    private String district;
    private String ward;
    private String detail;
}