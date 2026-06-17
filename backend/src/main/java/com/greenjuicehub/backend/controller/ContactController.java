package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.contact.request.CreateContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import com.greenjuicehub.backend.service.contact.IContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final IContactService contactService;

    @PostMapping
    public ResponseEntity<ContactResponse> createContact(
            @Valid @RequestBody CreateContactRequest request) {
        return ResponseEntity.ok(contactService.createContact(request));
    }
}