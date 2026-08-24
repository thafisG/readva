package com.readva.api.account.web;

import com.readva.api.auth.application.ReaderAccessService;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/readers")
public class ReaderAccountController {
    private final ReaderAccessService readerAccessService;

    public ReaderAccountController(ReaderAccessService readerAccessService) {
        this.readerAccessService = readerAccessService;
    }

    @GetMapping("/{readerId}")
    public ReaderResponse findById(@PathVariable UUID readerId, Authentication authentication) {
        return ReaderResponse.from(readerAccessService.requireOwner(readerId, authentication));
    }
}
