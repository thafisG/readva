package com.readva.api.gamification.web;

import com.readva.api.auth.application.ReaderAccessService;
import com.readva.api.gamification.application.GamificationService;
import com.readva.api.gamification.domain.GamificationEventType;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/readers/{readerId}/gamification")
public class GamificationController {
    private final GamificationService service;
    private final ReaderAccessService readerAccessService;

    public GamificationController(
            GamificationService service, ReaderAccessService readerAccessService) {
        this.service = service;
        this.readerAccessService = readerAccessService;
    }

    @GetMapping
    public ReaderGamificationResponse get(
            @PathVariable UUID readerId, Authentication authentication) {
        requireOwner(readerId, authentication);
        return ReaderGamificationResponse.from(service.get(readerId));
    }

    @PutMapping("/goals")
    public ReaderGamificationResponse saveGoals(
            @PathVariable UUID readerId,
            @Valid @RequestBody ReaderGoalsRequest request,
            Authentication authentication) {
        requireOwner(readerId, authentication);
        return ReaderGamificationResponse.from(
                service.saveGoals(readerId, request.toGoals(), request.timeZone()));
    }

    @PostMapping("/import")
    public ReaderGamificationResponse importState(
            @PathVariable UUID readerId,
            @Valid @RequestBody ImportGamificationRequest request,
            Authentication authentication) {
        requireOwner(readerId, authentication);
        return ReaderGamificationResponse.from(service.importState(readerId, request.toCommand()));
    }

    @PutMapping("/streak-days/{date}")
    public ReaderGamificationResponse markDay(
            @PathVariable UUID readerId,
            @PathVariable LocalDate date,
            Authentication authentication) {
        requireOwner(readerId, authentication);
        return ReaderGamificationResponse.from(service.markDay(readerId, date));
    }

    @DeleteMapping("/streak-days/{date}")
    public ReaderGamificationResponse unmarkDay(
            @PathVariable UUID readerId,
            @PathVariable LocalDate date,
            Authentication authentication) {
        requireOwner(readerId, authentication);
        return ReaderGamificationResponse.from(service.unmarkDay(readerId, date));
    }

    @PostMapping("/events")
    public ReaderGamificationResponse recordEvent(
            @PathVariable UUID readerId,
            @Valid @RequestBody GamificationEventRequest request,
            Authentication authentication) {
        requireOwner(readerId, authentication);
        return ReaderGamificationResponse.from(service.recordEvent(
                readerId,
                GamificationEventType.fromApiValue(request.type()),
                request.bookId(),
                request.occurredOn()));
    }

    @PostMapping("/missions/seen")
    public ReaderGamificationResponse markMissionsSeen(
            @PathVariable UUID readerId,
            @Valid @RequestBody MissionsSeenRequest request,
            Authentication authentication) {
        requireOwner(readerId, authentication);
        return ReaderGamificationResponse.from(service.markMissionsSeen(readerId, request.keys()));
    }

    private void requireOwner(UUID readerId, Authentication authentication) {
        readerAccessService.requireOwner(readerId, authentication);
    }
}
