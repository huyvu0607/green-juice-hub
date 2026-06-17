package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import com.greenjuicehub.backend.entity.Contact;
import org.springframework.stereotype.Component;

@Component
public class ContactMapper {

    public ContactResponse toResponse(Contact c) {
        return ContactResponse.builder()
                .id(c.getId())
                .fullName(c.getFullName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .subject(c.getSubject())
                .message(c.getMessage())
                .status(c.getStatus())
                .reply(c.getReply())
                .repliedAt(c.getRepliedAt())
                .repliedByName(c.getRepliedByName())
                .createdAt(c.getCreatedAt())
                .build();
    }
}