package com.greenjuicehub.backend.dto.contact.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateContactRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100)
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 100)
    private String email;

    @Size(max = 15)
    private String phone;

    @NotBlank(message = "Chủ đề không được để trống")
    @Size(max = 200)
    private String subject;

    @NotBlank(message = "Nội dung không được để trống")
    private String message;
}