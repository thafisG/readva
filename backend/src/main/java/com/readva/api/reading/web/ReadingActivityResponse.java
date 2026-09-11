package com.readva.api.reading.web;

import com.readva.api.reading.domain.ReadingActivity;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ReadingActivityResponse(
        String id,
        UUID readerId,
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
        Instant updatedAt) {
    public static ReadingActivityResponse from(ReadingActivity activity) {
        return new ReadingActivityResponse(
                activity.getClientId(),
                activity.getReaderId(),
                activity.getBookReference(),
                activity.getBookTitle(),
                activity.getBookAuthor(),
                activity.getBookCategory(),
                activity.getActionType().apiValue(),
                activity.getPagesRead(),
                activity.getMinutesRead(),
                activity.getNote(),
                activity.getOccurredOn(),
                activity.getCreatedAt(),
                activity.getUpdatedAt());
    }
}
