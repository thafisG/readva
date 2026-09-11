package com.readva.api.library.web;

import com.readva.api.auth.application.ReaderAccessService;
import com.readva.api.library.application.ReaderLibraryService;
import com.readva.api.shared.domain.InvalidRequestException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
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
@RequestMapping("/api/readers/{readerId}/books")
public class ReaderLibraryController {
    private final ReaderLibraryService service;
    private final ReaderAccessService readerAccessService;

    public ReaderLibraryController(
            ReaderLibraryService service, ReaderAccessService readerAccessService) {
        this.service = service;
        this.readerAccessService = readerAccessService;
    }

    @GetMapping
    public List<ReaderBookResponse> list(
            @PathVariable UUID readerId, Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return service.list(readerId).stream().map(ReaderBookResponse::from).toList();
    }

    @PutMapping("/{bookId}")
    public ReaderBookResponse save(
            @PathVariable UUID readerId,
            @PathVariable @Size(max = 160) String bookId,
            @Valid @RequestBody SaveReaderBookRequest request,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        if (!bookId.equals(request.id())) {
            throw new InvalidRequestException(
                    "O identificador do livro não corresponde à URL.");
        }
        return ReaderBookResponse.from(service.save(readerId, request.toCommand()));
    }

    @PostMapping("/import")
    public List<ReaderBookResponse> importBooks(
            @PathVariable UUID readerId,
            @RequestBody List<@Valid SaveReaderBookRequest> requests,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return service.importBooks(readerId, requests.stream()
                        .map(SaveReaderBookRequest::toCommand)
                        .toList())
                .stream()
                .map(ReaderBookResponse::from)
                .toList();
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID readerId,
            @PathVariable @Size(max = 160) String bookId,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        service.delete(readerId, bookId);
        return ResponseEntity.noContent().build();
    }
}
