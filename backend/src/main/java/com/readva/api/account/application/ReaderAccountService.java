package com.readva.api.account.application;

import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.account.infrastructure.ReaderAccountRepository;
import com.readva.api.shared.domain.ConflictException;
import com.readva.api.shared.domain.ResourceNotFoundException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReaderAccountService {
    private final ReaderAccountRepository repository;

    public ReaderAccountService(ReaderAccountRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ReaderAccount create(String displayName, String email, String passwordHash) {
        String normalizedEmail = ReaderAccount.normalizeEmail(email);
        if (repository.existsByNormalizedEmail(normalizedEmail)) {
            throw new ConflictException("Já existe um leitor cadastrado com este e-mail.");
        }
        return repository.saveAndFlush(new ReaderAccount(displayName, email, passwordHash));
    }

    @Transactional(readOnly = true)
    public ReaderAccount findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leitor não encontrado."));
    }

    @Transactional(readOnly = true)
    public ReaderAccount findByEmail(String email) {
        return repository.findByNormalizedEmail(ReaderAccount.normalizeEmail(email))
                .orElseThrow(() -> new ResourceNotFoundException("Leitor não encontrado."));
    }
}
