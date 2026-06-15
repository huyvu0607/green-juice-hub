package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Contact;
import com.greenjuicehub.backend.entity.Contact.ContactStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRepository extends JpaRepository<Contact, Long> {
    Page<Contact> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Contact> findByStatusOrderByCreatedAtDesc(ContactStatus status, Pageable pageable);
}