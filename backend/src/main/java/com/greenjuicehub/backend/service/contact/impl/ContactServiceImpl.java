package com.greenjuicehub.backend.service.contact.impl;

import com.greenjuicehub.backend.dto.contact.request.CreateContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import com.greenjuicehub.backend.entity.Contact;
import com.greenjuicehub.backend.mapper.ContactMapper;
import com.greenjuicehub.backend.repository.ContactRepository;
import com.greenjuicehub.backend.service.contact.IContactService;
import com.greenjuicehub.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements IContactService {

    private final ContactRepository contactRepository;
    private final EmailService emailService;
    private final ContactMapper contactMapper;

    @Override
    @Transactional
    public ContactResponse createContact(CreateContactRequest request) {
        Contact contact = Contact.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .subject(request.getSubject())
                .message(request.getMessage())
                .build();

        ContactResponse response = contactMapper.toResponse(contactRepository.save(contact));
        emailService.sendContactNotification(request);
        return response;
    }
}