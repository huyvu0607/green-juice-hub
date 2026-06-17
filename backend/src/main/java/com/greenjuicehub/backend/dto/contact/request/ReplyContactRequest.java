package com.greenjuicehub.backend.dto.contact.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReplyContactRequest {

    @NotBlank(message = "Nội dung phản hồi không được để trống")
    private String reply;
}