package com.readva.api.reading.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateReadingActivityRequest(
        @NotBlank @Size(max = 160) String bookReference,
        @NotBlank @Size(max = 240) String bookTitle,
        @PositiveOrZero int pagesRead,
        @PositiveOrZero int minutesRead,
        @Size(max = 1000) String note,
        @NotNull LocalDate occurredOn) {}
