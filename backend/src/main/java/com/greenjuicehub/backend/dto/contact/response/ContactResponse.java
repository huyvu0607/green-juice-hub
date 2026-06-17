package com.greenjuicehub.backend.dto.contact.response;

import com.greenjuicehub.backend.entity.Contact.ContactStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ContactResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private ContactStatus status;
    private String reply;
    private LocalDateTime repliedAt;
    private String repliedByName;
    private LocalDateTime createdAt;
}