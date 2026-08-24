package com.readva.api.auth.web;

import com.readva.api.account.domain.ReaderAccount;
import java.util.UUID;

public record AuthenticatedReaderResponse(UUID id, String email, String displayName) {
    public static AuthenticatedReaderResponse from(ReaderAccount reader) {
        return new AuthenticatedReaderResponse(
                reader.getId(), reader.getEmail(), reader.getDisplayName());
    }
}
