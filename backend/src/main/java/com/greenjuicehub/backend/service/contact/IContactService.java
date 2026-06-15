package com.greenjuicehub.backend.service.contact;

import com.greenjuicehub.backend.dto.contact.request.CreateContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IContactService {
    ContactResponse createContact(CreateContactRequest request);

    // Admin/Staff
    Page<ContactResponse> getContacts(String status, Pageable pageable);
    ContactResponse updateStatus(Long id, String status);
}