package com.greenjuicehub.backend.dto.contact.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ContactStatsResponse {
    private long totalNew;
    private long totalInProgress;
    private long totalResolved;
    private long total;
}