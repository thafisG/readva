package com.readva.api.reading.web;

import com.readva.api.auth.application.ReaderAccessService;
import com.readva.api.reading.application.ReadingActivityService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/readers/{readerId}/activities")
public class ReadingActivityController {
    private final ReadingActivityService service;
    private final ReaderAccessService readerAccessService;

    public ReadingActivityController(
            ReadingActivityService service, ReaderAccessService readerAccessService) {
        this.service = service;
        this.readerAccessService = readerAccessService;
    }

    @PostMapping
    public ResponseEntity<ReadingActivityResponse> record(
            @PathVariable UUID readerId,
            @Valid @RequestBody CreateReadingActivityRequest request,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        ReadingActivityResponse response = ReadingActivityResponse.from(service.record(
                readerId,
                request.bookReference(),
                request.bookTitle(),
                request.pagesRead(),
                request.minutesRead(),
                request.note(),
                request.occurredOn()));
        return ResponseEntity.created(
                        URI.create("/api/readers/" + readerId + "/activities/" + response.id()))
                .body(response);
    }

    @GetMapping
    public List<ReadingActivityResponse> list(
            @PathVariable UUID readerId, Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return service.listByReader(readerId).stream()
                .map(ReadingActivityResponse::from)
                .toList();
    }
}
