package com.readva.api.auth.web;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.auth.application.AuthenticationService;
import com.readva.api.auth.application.AuthenticationService.AuthenticatedReader;
import com.readva.api.auth.passwordreset.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {
    private final AuthenticationService authenticationService;
    private final ReaderAccountService readerAccountService;
    private final PasswordResetService passwordResetService;
    private final SecurityContextRepository securityContextRepository;

    public AuthenticationController(
            AuthenticationService authenticationService,
            ReaderAccountService readerAccountService,
            PasswordResetService passwordResetService,
            SecurityContextRepository securityContextRepository) {
        this.authenticationService = authenticationService;
        this.readerAccountService = readerAccountService;
        this.passwordResetService = passwordResetService;
        this.securityContextRepository = securityContextRepository;
    }

    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken csrfToken) {
        return csrfToken;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthenticatedReaderResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthenticatedReader result = authenticationService.register(
                request.displayName(), request.email(), request.password());
        saveSession(result.authentication(), httpRequest, httpResponse);
        AuthenticatedReaderResponse response = AuthenticatedReaderResponse.from(result.reader());
        return ResponseEntity.created(URI.create("/api/readers/" + response.id())).body(response);
    }

    @PostMapping("/login")
    public AuthenticatedReaderResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthenticatedReader result = authenticationService.login(request.email(), request.password());
        saveSession(result.authentication(), httpRequest, httpResponse);
        return AuthenticatedReaderResponse.from(result.reader());
    }

    @PostMapping("/password-reset")
    public ResponseEntity<Map<String, String>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request.email());
        return ResponseEntity.ok(Map.of(
                "message", "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha."));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Map<String, String>> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmationRequest request) {
        passwordResetService.confirmReset(request.token(), request.password());
        return ResponseEntity.ok(Map.of("message", "Senha atualizada. Você já pode entrar com a nova senha."));
    }

    @GetMapping("/session")
    public AuthenticatedReaderResponse session(Authentication authentication) {
        return AuthenticatedReaderResponse.from(readerAccountService.findByEmail(authentication.getName()));
    }

    private void saveSession(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}
