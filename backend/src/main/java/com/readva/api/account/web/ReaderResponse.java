package com.readva.api.account.web;

import com.readva.api.account.domain.ReaderAccount;
import java.time.Instant;
import java.util.UUID;

public record ReaderResponse(UUID id, String displayName, String email, Instant createdAt) {
    public static ReaderResponse from(ReaderAccount account) {
        return new ReaderResponse(
                account.getId(), account.getDisplayName(), account.getEmail(), account.getCreatedAt());
    }
}
