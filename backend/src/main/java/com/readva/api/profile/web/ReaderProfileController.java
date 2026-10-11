package com.readva.api.profile.web;

import com.readva.api.auth.application.ReaderAccessService;
import com.readva.api.profile.application.ReaderProfileService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/readers/{readerId}/profile")
public class ReaderProfileController {
    private final ReaderAccessService readerAccessService;
    private final ReaderProfileService service;

    public ReaderProfileController(
            ReaderAccessService readerAccessService, ReaderProfileService service) {
        this.readerAccessService = readerAccessService;
        this.service = service;
    }

    @GetMapping
    public ReaderProfileResponse get(
            @PathVariable UUID readerId, Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return ReaderProfileResponse.from(service.get(readerId));
    }

    @PutMapping
    public ReaderProfileResponse save(
            @PathVariable UUID readerId,
            @Valid @RequestBody SaveReaderProfileRequest request,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return ReaderProfileResponse.from(service.save(readerId, request.toCommand()));
    }

    @PostMapping("/import")
    public ReaderProfileResponse importLegacy(
            @PathVariable UUID readerId,
            @Valid @RequestBody ImportReaderProfileRequest request,
            Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
        return ReaderProfileResponse.from(service.importLegacy(readerId, request.toCommand()));
    }
}
