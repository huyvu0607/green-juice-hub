package com.greenjuicehub.backend.service.contact.impl;

import com.greenjuicehub.backend.dto.contact.request.CreateContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import com.greenjuicehub.backend.entity.Contact;
import com.greenjuicehub.backend.entity.Contact.ContactStatus;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.ContactRepository;
import com.greenjuicehub.backend.service.contact.IContactService;
import com.greenjuicehub.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements IContactService {

    private final ContactRepository contactRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public ContactResponse createContact(CreateContactRequest request) {
        Contact contact = Contact.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .subject(request.getSubject())
                .message(request.getMessage())
                .status(ContactStatus.NEW)
                .build();

        ContactResponse response = toResponse(contactRepository.save(contact));
        emailService.sendContactNotification(request);  // ← thêm
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContactResponse> getContacts(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            ContactStatus s = ContactStatus.valueOf(status.toUpperCase());
            return contactRepository.findByStatusOrderByCreatedAtDesc(s, pageable)
                    .map(this::toResponse);
        }
        return contactRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public ContactResponse updateStatus(Long id, String status) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy liên hệ"));

        contact.setStatus(ContactStatus.valueOf(status.toUpperCase()));
        return toResponse(contactRepository.save(contact));
    }

    private ContactResponse toResponse(Contact c) {
        return ContactResponse.builder()
                .id(c.getId())
                .fullName(c.getFullName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .subject(c.getSubject())
                .message(c.getMessage())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}