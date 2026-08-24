package com.readva.api.reading;

import static org.assertj.core.api.Assertions.assertThat;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.reading.application.ReadingActivityService;
import com.readva.api.reading.domain.ReadingActivity;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReaderJourneyIntegrationTest {
    @Autowired private ReaderAccountService readerAccountService;
    @Autowired private ReadingActivityService readingActivityService;

    @Test
    void persistsAReaderAndTheirReadingActivity() {
        ReaderAccount reader = readerAccountService.create("Thais", "THAIS@example.com");
        readingActivityService.record(
                reader.getId(),
                "open-library:OL123W",
                "O Conto da Aia",
                24,
                35,
                "Leitura da noite",
                LocalDate.of(2026, 8, 24));

        List<ReadingActivity> activities = readingActivityService.listByReader(reader.getId());

        assertThat(activities).hasSize(1);
        assertThat(activities.getFirst().getPagesRead()).isEqualTo(24);
        assertThat(activities.getFirst().getMinutesRead()).isEqualTo(35);
    }
}
