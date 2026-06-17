package com.greenjuicehub.backend.service.contact;

import com.greenjuicehub.backend.dto.contact.request.CreateContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;

public interface IContactService {
    ContactResponse createContact(CreateContactRequest request);
}