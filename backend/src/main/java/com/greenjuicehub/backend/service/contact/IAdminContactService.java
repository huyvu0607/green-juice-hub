package com.greenjuicehub.backend.service.contact;

import com.greenjuicehub.backend.dto.contact.request.ReplyContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import com.greenjuicehub.backend.dto.contact.response.ContactStatsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IAdminContactService {
    Page<ContactResponse> getContacts(String status, Pageable pageable);
    ContactResponse updateStatus(Long id, String status);
    ContactResponse replyContact(Long id, ReplyContactRequest request, Long adminId);
    ContactStatsResponse getStats();
}