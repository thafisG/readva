package com.readva.api.account.web;

import com.readva.api.account.application.ReaderAccountService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/readers")
public class ReaderAccountController {
    private final ReaderAccountService service;

    public ReaderAccountController(ReaderAccountService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ReaderResponse> create(@Valid @RequestBody CreateReaderRequest request) {
        ReaderResponse response = ReaderResponse.from(service.create(request.displayName(), request.email()));
        return ResponseEntity.created(URI.create("/api/readers/" + response.id())).body(response);
    }

    @GetMapping("/{readerId}")
    public ReaderResponse findById(@PathVariable UUID readerId) {
        return ReaderResponse.from(service.findById(readerId));
    }
}
