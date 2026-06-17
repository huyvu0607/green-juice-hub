package com.greenjuicehub.backend.service.contact.impl;

import com.greenjuicehub.backend.dto.contact.request.ReplyContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import com.greenjuicehub.backend.dto.contact.response.ContactStatsResponse;
import com.greenjuicehub.backend.entity.Contact;
import com.greenjuicehub.backend.entity.Contact.ContactStatus;
import com.greenjuicehub.backend.entity.User;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.ContactMapper;
import com.greenjuicehub.backend.repository.ContactRepository;
import com.greenjuicehub.backend.repository.UserRepository;
import com.greenjuicehub.backend.service.contact.IAdminContactService;
import com.greenjuicehub.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminContactServiceImpl implements IAdminContactService {

    private final ContactRepository contactRepository;
    private final EmailService emailService;
    private final ContactMapper contactMapper;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ContactResponse> getContacts(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            ContactStatus s = ContactStatus.valueOf(status.toUpperCase());
            return contactRepository.findByStatusOrderByCreatedAtDesc(s, pageable)
                    .map(contactMapper::toResponse);
        }
        return contactRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(contactMapper::toResponse);
    }

    @Override
    @Transactional
    public ContactResponse updateStatus(Long id, String status) {
        Contact contact = findOrThrow(id);
        contact.setStatus(ContactStatus.valueOf(status.toUpperCase()));
        return contactMapper.toResponse(contactRepository.save(contact));
    }

    @Override
    @Transactional
    public ContactResponse replyContact(Long id, ReplyContactRequest request, Long adminId) {
        Contact contact = findOrThrow(id);

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Admin không tồn tại"));

        contact.setReply(request.getReply());
        contact.setRepliedAt(LocalDateTime.now());
        contact.setRepliedByName(admin.getName()); // hoặc getEmail()

        if (contact.getStatus() == ContactStatus.NEW) {
            contact.setStatus(ContactStatus.IN_PROGRESS);
        }

        Contact saved = contactRepository.save(contact);

        emailService.sendContactReply(
                contact.getEmail(),
                contact.getFullName(),
                contact.getSubject(),
                request.getReply()
        );

        return contactMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ContactStatsResponse getStats() {
        long newCount        = contactRepository.countByStatus(ContactStatus.NEW);
        long inProgressCount = contactRepository.countByStatus(ContactStatus.IN_PROGRESS);
        long resolvedCount   = contactRepository.countByStatus(ContactStatus.RESOLVED);
        long total           = contactRepository.countAll();
        return new ContactStatsResponse(newCount, inProgressCount, resolvedCount, total);
    }

    private Contact findOrThrow(Long id) {
        return contactRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy liên hệ"));
    }
}