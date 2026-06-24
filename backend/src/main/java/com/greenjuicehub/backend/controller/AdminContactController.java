package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.PageResponse;
import com.greenjuicehub.backend.dto.contact.request.ReplyContactRequest;
import com.greenjuicehub.backend.dto.contact.response.ContactResponse;
import com.greenjuicehub.backend.dto.contact.response.ContactStatsResponse;
import com.greenjuicehub.backend.service.contact.IAdminContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/contacts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class AdminContactController {

    private final IAdminContactService adminContactService;

    @GetMapping
    public ResponseEntity<PageResponse<ContactResponse>> getContacts(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(
                PageResponse.from(adminContactService.getContacts(status, pageable))
        );    }

    @GetMapping("/stats")
    public ResponseEntity<ContactStatsResponse> getStats() {
        return ResponseEntity.ok(adminContactService.getStats());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ContactResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(adminContactService.updateStatus(id, status));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ContactResponse> replyContact(
            @PathVariable Long id,
            @Valid @RequestBody ReplyContactRequest request,
            @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.ok(
                adminContactService.replyContact(id, request, adminId)
        );
    }
}