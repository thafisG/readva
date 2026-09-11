package com.readva.api.reading.web;

import com.readva.api.auth.application.ReaderAccessService;
import com.readva.api.reading.application.ReadingActivityService;
import com.readva.api.reading.domain.ReadingActivity;
import com.readva.api.shared.domain.InvalidRequestException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
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

    @PutMapping("/{activityId}")
    public ReadingActivityResponse save(
            @PathVariable UUID readerId,
            @PathVariable @Size(max = 160) String activityId,
            @Valid @RequestBody SaveReadingActivityRequest request,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        if (!activityId.equals(request.id())) {
            throw new InvalidRequestException("O identificador da atividade não corresponde à URL.");
        }
        return ReadingActivityResponse.from(service.save(readerId, request.toCommand()));
    }

    @PostMapping("/import")
    public List<ReadingActivityResponse> importActivities(
            @PathVariable UUID readerId,
            @Size(max = 500) @RequestBody List<@Valid SaveReadingActivityRequest> requests,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return service.importActivities(
                        readerId,
                        requests.stream().map(SaveReadingActivityRequest::toCommand).toList())
                .stream()
                .map(ReadingActivityResponse::from)
                .toList();
    }

    @GetMapping
    public List<ReadingActivityResponse> list(
            @PathVariable UUID readerId, Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return service.listByReader(readerId).stream()
                .map(ReadingActivityResponse::from)
                .toList();
    }

    @DeleteMapping("/{activityId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID readerId,
            @PathVariable @Size(max = 160) String activityId,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        service.delete(readerId, activityId);
        return ResponseEntity.noContent().build();
    }
}
