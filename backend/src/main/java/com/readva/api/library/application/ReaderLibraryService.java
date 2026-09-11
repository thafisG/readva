package com.readva.api.library.application;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.gamification.application.GamificationService;
import com.readva.api.gamification.domain.GamificationEventType;
import com.readva.api.library.domain.ReaderBook;
import com.readva.api.library.domain.ReaderBookStatus;
import com.readva.api.library.infrastructure.ReaderBookRepository;
import com.readva.api.shared.domain.InvalidRequestException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReaderLibraryService {
    private final ReaderBookRepository repository;
    private final ReaderAccountService readerAccountService;
    private final GamificationService gamificationService;

    public ReaderLibraryService(
            ReaderBookRepository repository,
            ReaderAccountService readerAccountService,
            GamificationService gamificationService) {
        this.repository = repository;
        this.readerAccountService = readerAccountService;
        this.gamificationService = gamificationService;
    }

    @Transactional(readOnly = true)
    public List<ReaderBook> list(UUID readerId) {
        readerAccountService.findById(readerId);
        return repository.findAllByReader_IdOrderByCreatedAtDesc(readerId);
    }

    @Transactional
    public ReaderBook save(UUID readerId, SaveReaderBookCommand command) {
        ReaderAccount reader = readerAccountService.findById(readerId);
        ValidatedBook book = validate(command);
        ReaderBook existing = repository
                .findByReader_IdAndClientId(readerId, book.clientId())
                .orElse(null);
        boolean isNewBook = existing == null;
        boolean wasCompleted = existing != null && existing.getStatus() == ReaderBookStatus.COMPLETED;
        ReaderBook stored;
        if (existing == null) {
            stored = new ReaderBook(
                    reader,
                    book.clientId(),
                    book.title(),
                    book.author(),
                    book.coverUrl(),
                    book.totalPages(),
                    book.currentPage(),
                    book.category(),
                    book.status(),
                    command.createdAt(),
                    command.completedAt());
        } else {
            existing.replace(
                    book.title(),
                    book.author(),
                    book.coverUrl(),
                    book.totalPages(),
                    book.currentPage(),
                    book.category(),
                    book.status(),
                    command.completedAt());
            stored = existing;
        }

        ReaderBook saved = repository.save(stored);
        if (isNewBook) {
            gamificationService.recordBookEvent(
                    readerId, GamificationEventType.BOOK_STARTED, saved.getClientId(), command.startedOn());
        }
        if (!wasCompleted && saved.getStatus() == ReaderBookStatus.COMPLETED) {
            gamificationService.recordBookEvent(
                    readerId,
                    GamificationEventType.BOOK_FINISHED,
                    saved.getClientId(),
                    command.completedOn() == null ? command.startedOn() : command.completedOn());
        }
        return saved;
    }

    @Transactional
    public List<ReaderBook> importBooks(UUID readerId, List<SaveReaderBookCommand> commands) {
        if (commands.size() > 500) {
            throw new InvalidRequestException("A importação aceita no máximo 500 livros por vez.");
        }
        commands.forEach(command -> save(readerId, command));
        return repository.findAllByReader_IdOrderByCreatedAtDesc(readerId);
    }

    @Transactional
    public void adjustProgress(UUID readerId, String clientId, int pagesDelta) {
        if (pagesDelta == 0) return;
        repository.findByReader_IdAndClientId(readerId, clientId).ifPresent(book -> {
            book.adjustProgress(pagesDelta);
            repository.save(book);
        });
    }
    @Transactional
    public void delete(UUID readerId, String clientId) {
        repository.findByReader_IdAndClientId(readerId, normalize(clientId, "livro", 160))
                .ifPresent(repository::delete);
    }

    private ValidatedBook validate(SaveReaderBookCommand command) {
        String clientId = normalize(command.clientId(), "identificador", 160);
        String title = normalize(command.title(), "título", 240);
        String author = normalize(command.author(), "autor", 160);
        String coverUrl = normalize(command.coverUrl(), "capa", 200_000);
        String category = normalize(command.category(), "categoria", 100);
        if (command.totalPages() <= 0) {
            throw new InvalidRequestException("O total de páginas deve ser maior que zero.");
        }
        if (command.currentPage() < 0 || command.currentPage() > command.totalPages()) {
            throw new InvalidRequestException("A página atual deve estar entre zero e o total do livro.");
        }
        return new ValidatedBook(
                clientId,
                title,
                author,
                coverUrl,
                command.totalPages(),
                command.currentPage(),
                category,
                ReaderBookStatus.fromApiValue(command.status()));
    }

    private String normalize(String value, String field, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException("Informe o " + field + " do livro.");
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new InvalidRequestException("O campo " + field + " excede o tamanho permitido.");
        }
        return normalized;
    }

    private record ValidatedBook(
            String clientId,
            String title,
            String author,
            String coverUrl,
            int totalPages,
            int currentPage,
            String category,
            ReaderBookStatus status) {}
}
