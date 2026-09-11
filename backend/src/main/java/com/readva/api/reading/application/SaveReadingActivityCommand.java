package com.readva.api.reading.application;

import java.time.Instant;
import java.time.LocalDate;

public record SaveReadingActivityCommand(
        String clientId,
        String bookReference,
        String bookTitle,
        String bookAuthor,
        String bookCategory,
        String actionType,
        int pagesRead,
        int minutesRead,
        String note,
        LocalDate occurredOn,
        Instant createdAt,
        Instant updatedAt) {}
