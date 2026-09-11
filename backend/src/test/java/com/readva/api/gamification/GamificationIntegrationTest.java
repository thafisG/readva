package com.readva.api.gamification;

import static org.assertj.core.api.Assertions.assertThat;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.gamification.application.GamificationService;
import com.readva.api.gamification.application.ImportGamificationCommand;
import com.readva.api.gamification.domain.GamificationEventType;
import com.readva.api.gamification.domain.ReaderGamificationState;
import com.readva.api.gamification.domain.ReaderGoals;
import com.readva.api.reading.application.ReadingActivityService;
import com.readva.api.reading.application.SaveReadingActivityCommand;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GamificationIntegrationTest {
    @Autowired private ReaderAccountService readerAccountService;
    @Autowired private ReadingActivityService readingActivityService;
    @Autowired private GamificationService gamificationService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void calculatesMissionsXpAndStreakFromThePersistedReadingTransaction() {
        ReaderAccount reader = createReader("transaction");
        LocalDate date = LocalDate.of(2026, 8, 20);

        readingActivityService.save(
                reader.getId(), activity("device-a-session", date, 10, 15, "2026-08-20T12:00:00Z"));

        ReaderGamificationState state = gamificationService.get(reader.getId());

        assertThat(state.markedDays()).containsExactly(date);
        assertThat(state.missionHistory().get(date))
                .containsExactlyInAnyOrder("read-pages", "read-minutes", "read-session");
        assertThat(state.totalXp()).isEqualTo(110);
        assertThat(state.unseenMissionKeys()).hasSize(3);

        readingActivityService.save(
                reader.getId(), activity("device-a-session", date, 20, 30, "2026-08-20T12:05:00Z"));

        assertThat(gamificationService.get(reader.getId()).totalXp()).isEqualTo(110);
    }

    @Test
    void importsLegacyGamificationOnlyOnceAndSharesTheSameStateWithAnotherDevice() {
        ReaderAccount reader = createReader("migration");
        LocalDate date = LocalDate.of(2026, 8, 20);
        ImportGamificationCommand legacy = new ImportGamificationCommand(
                new ReaderGoals(45, 3),
                "America/Fortaleza",
                80,
                List.of(date),
                Map.of(date, List.of("read-pages")),
                List.of(date + ":read-pages"),
                List.of("first-mission"),
                List.of("book-finished-on-device-a"));

        ReaderGamificationState firstDevice = gamificationService.importState(reader.getId(), legacy);
        ReaderGamificationState secondDevice = gamificationService.importState(reader.getId(), legacy);
        ReaderGamificationState reloaded = gamificationService.get(reader.getId());

        assertThat(firstDevice.localMigrationCompleted()).isTrue();
        assertThat(secondDevice.totalXp()).isEqualTo(80);
        assertThat(reloaded.goals()).isEqualTo(new ReaderGoals(45, 3));
        assertThat(reloaded.timeZone()).isEqualTo("America/Fortaleza");
        assertThat(reloaded.missionHistory().get(date)).containsExactly("read-pages");
        assertThat(reloaded.rewardedBookIds()).containsExactly("book-finished-on-device-a");
    }

    @Test
    void usesTheReadersTimeZoneForBookAndNightEvents() {
        ReaderAccount reader = createReader("timezone");
        gamificationService.saveGoals(
                reader.getId(), new ReaderGoals(60, 2), "America/Fortaleza");
        Instant afterMidnightUtc = Instant.parse("2026-08-20T01:30:00Z");
        LocalDate localDate = LocalDate.of(2026, 8, 19);

        gamificationService.recordBookEvent(
                reader.getId(), GamificationEventType.BOOK_STARTED, "book-1", localDate);
        readingActivityService.save(
                reader.getId(), activity("night-session", localDate, 1, 5, afterMidnightUtc.toString()));

        ReaderGamificationState state = gamificationService.get(reader.getId());

        assertThat(state.missionHistory().get(localDate)).contains("start-book");
        assertThat(state.achievementIds()).contains("night-owl");
        assertThat(state.timeZone()).isEqualTo("America/Fortaleza");
    }

    @Test
    void keepsAManualStreakDayAfterItsReadingIsDeleted() {
        ReaderAccount reader = createReader("manual-streak");
        LocalDate date = LocalDate.of(2026, 8, 21);
        readingActivityService.save(
                reader.getId(), activity("temporary-session", date, 2, 5, "2026-08-21T12:00:00Z"));
        gamificationService.markDay(reader.getId(), date);

        readingActivityService.delete(reader.getId(), "temporary-session");

        assertThat(gamificationService.get(reader.getId()).markedDays()).contains(date);
        gamificationService.unmarkDay(reader.getId(), date);
        assertThat(gamificationService.get(reader.getId()).markedDays()).doesNotContain(date);
    }

    private ReaderAccount createReader(String scenario) {
        String uniqueEmail = scenario + "+" + UUID.randomUUID() + "@example.com";
        return readerAccountService.create(
                "Leitora", uniqueEmail, passwordEncoder.encode("Leitura@123"));
    }

    private SaveReadingActivityCommand activity(
            String id, LocalDate date, int pages, int minutes, String timestamp) {
        Instant instant = Instant.parse(timestamp);
        return new SaveReadingActivityCommand(
                id,
                "book-1",
                "Duna",
                "Frank Herbert",
                "Ficção Científica",
                "progress",
                pages,
                minutes,
                "Sessão sincronizada",
                date,
                instant,
                instant);
    }
}