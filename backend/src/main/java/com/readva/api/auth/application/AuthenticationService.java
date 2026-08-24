package com.readva.api.auth.application;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.shared.domain.InvalidCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {
    private static final String INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos.";

    private final ReaderAccountService readerAccountService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthenticationService(
            ReaderAccountService readerAccountService,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager) {
        this.readerAccountService = readerAccountService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthenticatedReader register(String displayName, String email, String password) {
        ReaderAccount reader =
                readerAccountService.create(displayName, email, passwordEncoder.encode(password));
        Authentication authentication = authenticate(email, password);
        return new AuthenticatedReader(reader, authentication);
    }

    @Transactional(readOnly = true)
    public AuthenticatedReader login(String email, String password) {
        Authentication authentication = authenticate(email, password);
        ReaderAccount reader = readerAccountService.findByEmail(authentication.getName());
        return new AuthenticatedReader(reader, authentication);
    }

    private Authentication authenticate(String email, String password) {
        try {
            return authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            ReaderAccount.normalizeEmail(email), password));
        } catch (BadCredentialsException exception) {
            throw new InvalidCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }
    }

    public record AuthenticatedReader(ReaderAccount reader, Authentication authentication) {}
}
