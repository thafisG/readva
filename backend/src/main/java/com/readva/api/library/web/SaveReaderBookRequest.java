package com.readva.api.library.web;

import com.readva.api.library.application.SaveReaderBookCommand;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public record SaveReaderBookRequest(
        @NotBlank @Size(max = 160) String id,
        @NotBlank @Size(max = 240) String title,
        @NotBlank @Size(max = 160) String author,
        @NotBlank @Size(max = 200000) String coverUrl,
        @Positive @Max(1000000) int totalPages,
        @PositiveOrZero @Max(1000000) int currentPage,
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 32) String status,
        Instant createdAt,
        Instant completedAt,
        @NotNull LocalDate startedOn,
        LocalDate completedOn) {
    SaveReaderBookCommand toCommand() {
        return new SaveReaderBookCommand(
                id,
                title,
                author,
                coverUrl,
                totalPages,
                currentPage,
                category,
                status,
                createdAt,
                completedAt,
                startedOn,
                completedOn);
    }
}
