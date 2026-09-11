package com.readva.api.library;

import static org.assertj.core.api.Assertions.assertThat;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.library.application.ReaderLibraryService;
import com.readva.api.library.application.SaveReaderBookCommand;
import com.readva.api.library.domain.ReaderBook;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReaderLibraryIntegrationTest {
    @Autowired private ReaderAccountService readerAccountService;
    @Autowired private ReaderLibraryService libraryService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void importsUpdatesAndDeletesAReadersLibraryWithoutDuplicatingBooks() {
        ReaderAccount reader = readerAccountService.create(
                "Leitora", "library@example.com", passwordEncoder.encode("Leitura@123"));
        SaveReaderBookCommand reading = command("local-book-1", 80, "reading", null);

        libraryService.importBooks(reader.getId(), List.of(reading, reading));
        ReaderBook completed = libraryService.save(
                reader.getId(), command("local-book-1", 120, "completed", Instant.now()));

        assertThat(libraryService.list(reader.getId())).hasSize(1);
        assertThat(completed.getCurrentPage()).isEqualTo(300);
        assertThat(completed.getStatus().apiValue()).isEqualTo("completed");

        libraryService.delete(reader.getId(), "local-book-1");
        assertThat(libraryService.list(reader.getId())).isEmpty();
    }

    private SaveReaderBookCommand command(
            String id, int currentPage, String status, Instant completedAt) {
        return new SaveReaderBookCommand(
                id,
                "Duna",
                "Frank Herbert",
                "https://example.com/duna.jpg",
                300,
                currentPage,
                "Ficção Científica",
                status,
                Instant.parse("2026-08-01T12:00:00Z"),
                completedAt,
                LocalDate.of(2026, 8, 1),
                completedAt == null ? null : LocalDate.of(2026, 8, 20));
    }
}
