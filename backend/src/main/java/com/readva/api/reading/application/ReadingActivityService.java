package com.readva.api.reading.application;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.reading.domain.ReadingActivity;
import com.readva.api.reading.infrastructure.ReadingActivityRepository;
import com.readva.api.shared.domain.InvalidRequestException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReadingActivityService {
    private final ReadingActivityRepository repository;
    private final ReaderAccountService readerAccountService;

    public ReadingActivityService(
            ReadingActivityRepository repository, ReaderAccountService readerAccountService) {
        this.repository = repository;
        this.readerAccountService = readerAccountService;
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
        if (pagesRead <= 0 && minutesRead <= 0) {
            throw new InvalidRequestException("Informe páginas ou minutos lidos.");
        }
        ReaderAccount reader = readerAccountService.findById(readerId);
        return repository.save(new ReadingActivity(
                reader, bookReference, bookTitle, pagesRead, minutesRead, note, occurredOn));
    }

    @Transactional(readOnly = true)
    public List<ReadingActivity> listByReader(UUID readerId) {
        readerAccountService.findById(readerId);
        return repository.findAllByReader_IdOrderByOccurredOnDescCreatedAtDesc(readerId);
    }
}
