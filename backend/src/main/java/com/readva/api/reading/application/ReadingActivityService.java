package com.readva.api.reading.application;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.gamification.application.GamificationService;
import com.readva.api.library.application.ReaderLibraryService;
import com.readva.api.reading.domain.ReadingActivity;
import com.readva.api.reading.domain.ReadingActivityType;
import com.readva.api.reading.infrastructure.ReadingActivityRepository;
import com.readva.api.shared.domain.InvalidRequestException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReadingActivityService {
    private final ReadingActivityRepository repository;
    private final ReaderAccountService readerAccountService;
    private final ReaderLibraryService libraryService;
    private final GamificationService gamificationService;

    public ReadingActivityService(
            ReadingActivityRepository repository,
            ReaderAccountService readerAccountService,
            ReaderLibraryService libraryService,
            GamificationService gamificationService) {
        this.repository = repository;
        this.readerAccountService = readerAccountService;
        this.libraryService = libraryService;
        this.gamificationService = gamificationService;
    }

    @Transactional
    public ReadingActivity record(
            UUID readerId,
            String bookReference,
            String bookTitle,
            int pagesRead,
            int minutesRead,
            String note,
            LocalDate occurredOn) {
        Instant now = Instant.now();
        return save(
                readerId,
                new SaveReadingActivityCommand(
                        UUID.randomUUID().toString(),
                        bookReference,
                        bookTitle,
                        "Autor desconhecido",
                        null,
                        "progress",
                        pagesRead,
                        minutesRead,
                        note,
                        occurredOn,
                        now,
                        now));
    }

    @Transactional
    public ReadingActivity save(UUID readerId, SaveReadingActivityCommand command) {
        ReaderAccount reader = readerAccountService.findById(readerId);
        return save(reader, command, true, false);
    }

    @Transactional
    public List<ReadingActivity> importActivities(
            UUID readerId, List<SaveReadingActivityCommand> commands) {
        if (commands.size() > 500) {
            throw new InvalidRequestException("A importação aceita no máximo 500 atividades por vez.");
        }
        ReaderAccount reader = readerAccountService.findById(readerId);
        commands.forEach(command -> save(reader, command, false, true));
        return repository.findAllByReader_IdOrderByOccurredOnDescCreatedAtDesc(readerId);
    }

    @Transactional(readOnly = true)
    public List<ReadingActivity> listByReader(UUID readerId) {
        readerAccountService.findById(readerId);
        return repository.findAllByReader_IdOrderByOccurredOnDescCreatedAtDesc(readerId);
    }

    @Transactional
    public void delete(UUID readerId, String clientId) {
        String normalizedId = normalize(clientId, "identificador", 160, false);
        repository.findByReader_IdAndClientId(readerId, normalizedId).ifPresent(activity -> {
            LocalDate occurredOn = activity.getOccurredOn();
            libraryService.adjustProgress(readerId, activity.getBookReference(), -activity.getPagesRead());
            repository.delete(activity);
            repository.flush();
            gamificationService.reconcileDate(readerId, occurredOn);
        });
    }

    private ReadingActivity save(
            ReaderAccount reader,
            SaveReadingActivityCommand command,
            boolean adjustBookProgress,
            boolean onlyIfNewer) {
        ValidatedActivity input = validate(command);
        ReadingActivity existing = repository
                .findByReader_IdAndClientId(reader.getId(), input.clientId())
                .orElse(null);
        if (existing != null
                && onlyIfNewer
                && !input.updatedAt().isAfter(existing.getUpdatedAt())) {
            return existing;
        }

        int previousPages = existing == null ? 0 : existing.getPagesRead();
        LocalDate previousDate = existing == null ? null : existing.getOccurredOn();
        ReadingActivity activity;
        if (existing == null) {
            activity = new ReadingActivity(
                    reader,
                    input.clientId(),
                    input.bookReference(),
                    input.bookTitle(),
                    input.bookAuthor(),
                    input.bookCategory(),
                    input.actionType(),
                    input.pagesRead(),
                    input.minutesRead(),
                    input.note(),
                    input.occurredOn(),
                    input.createdAt(),
                    input.updatedAt());
        } else {
            existing.replace(
                    input.bookReference(),
                    input.bookTitle(),
                    input.bookAuthor(),
                    input.bookCategory(),
                    input.actionType(),
                    input.pagesRead(),
                    input.minutesRead(),
                    input.note(),
                    input.occurredOn(),
                    input.updatedAt());
            activity = existing;
        }

        ReadingActivity saved = repository.save(activity);
        repository.flush();
        if (adjustBookProgress) {
            libraryService.adjustProgress(
                    reader.getId(), input.bookReference(), input.pagesRead() - previousPages);
        }
        gamificationService.reconcileReading(reader.getId(), saved, previousDate);
        return saved;
    }

    private ValidatedActivity validate(SaveReadingActivityCommand command) {
        String clientId = normalize(command.clientId(), "identificador", 160, false);
        String bookReference = normalize(command.bookReference(), "livro", 160, false);
        String bookTitle = normalize(command.bookTitle(), "título", 240, false);
        String bookAuthor = normalize(command.bookAuthor(), "autor", 160, false);
        String bookCategory = normalize(command.bookCategory(), "categoria", 100, true);
        String note = normalize(command.note(), "comentário", 1000, true);
        if (command.pagesRead() < 0 || command.minutesRead() < 0) {
            throw new InvalidRequestException("Páginas e minutos não podem ser negativos.");
        }
        if (command.pagesRead() == 0 && command.minutesRead() == 0) {
            throw new InvalidRequestException("Informe páginas ou minutos lidos.");
        }
        LocalDate occurredOn = command.occurredOn();
        if (occurredOn == null) {
            throw new InvalidRequestException("Informe a data da leitura.");
        }
        Instant createdAt = command.createdAt() == null ? Instant.now() : command.createdAt();
        Instant updatedAt = command.updatedAt() == null ? createdAt : command.updatedAt();
        return new ValidatedActivity(
                clientId,
                bookReference,
                bookTitle,
                bookAuthor,
                bookCategory,
                ReadingActivityType.fromApiValue(command.actionType()),
                command.pagesRead(),
                command.minutesRead(),
                note,
                occurredOn,
                createdAt,
                updatedAt);
    }

    private String normalize(String value, String field, int maxLength, boolean nullable) {
        if (value == null || value.isBlank()) {
            if (nullable) return null;
            throw new InvalidRequestException("Informe o " + field + " da atividade.");
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new InvalidRequestException("O campo " + field + " excede o tamanho permitido.");
        }
        return normalized;
    }

    private record ValidatedActivity(
            String clientId,
            String bookReference,
            String bookTitle,
            String bookAuthor,
            String bookCategory,
            ReadingActivityType actionType,
            int pagesRead,
            int minutesRead,
            String note,
            LocalDate occurredOn,
            Instant createdAt,
            Instant updatedAt) {}
}
