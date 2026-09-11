package com.readva.api.library.web;

import com.readva.api.library.domain.ReaderBook;
import java.time.Instant;

public record ReaderBookResponse(
        String id,
        String title,
        String author,
        String coverUrl,
        int totalPages,
        int currentPage,
        String category,
        String status,
        Instant createdAt,
        Instant updatedAt,
        Instant completedAt) {
    static ReaderBookResponse from(ReaderBook book) {
        return new ReaderBookResponse(
                book.getClientId(),
                book.getTitle(),
                book.getAuthor(),
                book.getCoverUrl(),
                book.getTotalPages(),
                book.getCurrentPage(),
                book.getCategory(),
                book.getStatus().apiValue(),
                book.getCreatedAt(),
                book.getUpdatedAt(),
                book.getCompletedAt());
    }
}
