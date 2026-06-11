package com.greenjuicehub.backend.dto.address.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddressResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String province;
    private String district;
    private String ward;
    private Integer districtId;
    private String wardCode;
    private String detail;
    private Boolean isDefault;

    /** Chuỗi địa chỉ đầy đủ để hiển thị trên UI */
    public String getFullAddress() {
        return detail + ", " + ward + ", " + district + ", " + province;
    }
}