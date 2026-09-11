package com.readva.api.reading;

import static org.assertj.core.api.Assertions.assertThat;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.library.application.ReaderLibraryService;
import com.readva.api.library.application.SaveReaderBookCommand;
import com.readva.api.reading.application.ReadingActivityService;
import com.readva.api.reading.application.SaveReadingActivityCommand;
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
class ReadingActivitySynchronizationIntegrationTest {
    @Autowired private ReaderAccountService readerAccountService;
    @Autowired private ReaderLibraryService libraryService;
    @Autowired private ReadingActivityService activityService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void upsertsImportsAndDeletesActivitiesWithoutDuplicatingBookProgress() {
        ReaderAccount reader = readerAccountService.create(
                "Leitora", "activity-sync@example.com", passwordEncoder.encode("Leitura@123"));
        libraryService.save(
                reader.getId(),
                new SaveReaderBookCommand(
                        "book-1",
                        "Duna",
                        "Frank Herbert",
                        "https://example.com/duna.jpg",
                        300,
                        40,
                        "Ficção Científica",
                        "reading",
                        Instant.parse("2026-08-01T12:00:00Z"),
                        null,
                        LocalDate.of(2026, 8, 1),
                        null));

        activityService.save(reader.getId(), command("activity-1", 10, "2026-08-20T12:00:00Z"));
        activityService.save(reader.getId(), command("activity-1", 15, "2026-08-20T12:05:00Z"));

        assertThat(activityService.listByReader(reader.getId())).hasSize(1);
        assertThat(libraryService.list(reader.getId()).getFirst().getCurrentPage()).isEqualTo(55);

        SaveReadingActivityCommand imported =
                command("legacy-activity", 20, "2026-08-19T12:00:00Z");
        activityService.importActivities(reader.getId(), List.of(imported, imported));

        assertThat(activityService.listByReader(reader.getId())).hasSize(2);
        assertThat(libraryService.list(reader.getId()).getFirst().getCurrentPage()).isEqualTo(55);

        activityService.delete(reader.getId(), "activity-1");

        assertThat(activityService.listByReader(reader.getId()))
                .extracting(activity -> activity.getClientId())
                .containsExactly("legacy-activity");
        assertThat(libraryService.list(reader.getId()).getFirst().getCurrentPage()).isEqualTo(40);
    }

    private SaveReadingActivityCommand command(String id, int pages, String timestamp) {
        Instant instant = Instant.parse(timestamp);
        return new SaveReadingActivityCommand(
                id,
                "book-1",
                "Duna",
                "Frank Herbert",
                "Ficção Científica",
                "progress",
                pages,
                15,
                "Leitura da noite",
                LocalDate.of(2026, 8, 20),
                instant,
                instant);
    }
}
