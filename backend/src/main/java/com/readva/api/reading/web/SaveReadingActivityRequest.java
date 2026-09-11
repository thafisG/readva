package com.readva.api.reading.web;

import com.readva.api.reading.application.SaveReadingActivityCommand;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public record SaveReadingActivityRequest(
        @NotBlank @Size(max = 160) String id,
        @NotBlank @Size(max = 160) String bookReference,
        @NotBlank @Size(max = 240) String bookTitle,
        @NotBlank @Size(max = 160) String bookAuthor,
        @Size(max = 100) String bookCategory,
        @NotBlank @Size(max = 32) String actionType,
        @PositiveOrZero @Max(1000000) int pagesRead,
        @PositiveOrZero @Max(1000000) int minutesRead,
        @Size(max = 1000) String note,
        @NotNull LocalDate occurredOn,
        Instant createdAt,
        Instant updatedAt) {
    SaveReadingActivityCommand toCommand() {
        return new SaveReadingActivityCommand(
                id,
                bookReference,
                bookTitle,
                bookAuthor,
                bookCategory,
                actionType,
                pagesRead,
                minutesRead,
                note,
                occurredOn,
                createdAt,
                updatedAt);
    }
}
