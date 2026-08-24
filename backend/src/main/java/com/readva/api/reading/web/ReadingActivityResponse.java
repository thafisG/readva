package com.readva.api.reading.web;

import com.readva.api.reading.domain.ReadingActivity;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ReadingActivityResponse(
        UUID id,
        UUID readerId,
        String bookReference,
        String bookTitle,
        int pagesRead,
        int minutesRead,
        String note,
        LocalDate occurredOn,
        Instant createdAt) {
    public static ReadingActivityResponse from(ReadingActivity activity) {
        return new ReadingActivityResponse(
                activity.getId(),
                activity.getReaderId(),
                activity.getBookReference(),
                activity.getBookTitle(),
                activity.getPagesRead(),
                activity.getMinutesRead(),
                activity.getNote(),
                activity.getOccurredOn(),
                activity.getCreatedAt());
    }
}
