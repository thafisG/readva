package com.readva.api.auth.application;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.shared.domain.ForbiddenException;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReaderAccessService {
    private final ReaderAccountService readerAccountService;

    public ReaderAccessService(ReaderAccountService readerAccountService) {
        this.readerAccountService = readerAccountService;
    }

    @Transactional(readOnly = true)
    public ReaderAccount requireOwner(UUID readerId, Authentication authentication) {
        ReaderAccount reader = readerAccountService.findById(readerId);
        if (!reader.getNormalizedEmail().equals(authentication.getName())) {
            throw new ForbiddenException("Você não pode acessar os dados de outro leitor.");
        }
        return reader;
    }
}
