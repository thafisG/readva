package com.readva.api.gamification.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record GamificationEventRequest(
        @NotBlank @Size(max = 40) String type,
        @Size(max = 160) String bookId,
        @NotNull LocalDate occurredOn) {}
