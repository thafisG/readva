package com.readva.api.library.application;

import java.time.Instant;
import java.time.LocalDate;

public record SaveReaderBookCommand(
        String clientId,
        String title,
        String author,
        String coverUrl,
        int totalPages,
        int currentPage,
        String category,
        String status,
        Instant createdAt,
        Instant completedAt,
        LocalDate startedOn,
        LocalDate completedOn) {}
