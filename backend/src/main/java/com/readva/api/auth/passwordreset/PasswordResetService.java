package com.readva.api.auth.passwordreset;

import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.account.infrastructure.ReaderAccountRepository;
import com.readva.api.shared.domain.InvalidRequestException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordResetService {
    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    private static final Duration TOKEN_LIFETIME = Duration.ofMinutes(20);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ReaderAccountRepository readerRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String fromAddress;
    private final String webOrigin;

    public PasswordResetService(
            ReaderAccountRepository readerRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${readva.password-reset.enabled:false}") boolean enabled,
            @Value("${readva.password-reset.from:}") String fromAddress,
            @Value("${readva.web.allowed-origin}") String webOrigin) {
        this.readerRepository = readerRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.fromAddress = fromAddress;
        this.webOrigin = webOrigin;
    }

    @Transactional
    public void requestReset(String email) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (!enabled || mailSender == null || fromAddress.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "A recuperação de senha ainda não está configurada.");
        }

        readerRepository.findByNormalizedEmail(ReaderAccount.normalizeEmail(email)).ifPresent(reader ->
                sendResetEmail(reader, mailSender));
    }

    @Transactional
    public void confirmReset(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByTokenHashAndConsumedAtIsNull(hash(token))
                .filter(candidate -> candidate.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new InvalidRequestException(
                        "Este link expirou ou já foi utilizado. Solicite uma nova recuperação."));

        resetToken.getReader().updatePasswordHash(passwordEncoder.encode(newPassword));
        resetToken.consume();
    }

    private void sendResetEmail(ReaderAccount reader, JavaMailSender mailSender) {
        tokenRepository.deleteByReader_IdAndConsumedAtIsNull(reader.getId());

        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        PasswordResetToken resetToken = tokenRepository.save(new PasswordResetToken(
                reader, hash(rawToken), Instant.now().plus(TOKEN_LIFETIME)));

        String resetUrl = webOrigin.replaceAll("/+$", "") + "/login#resetToken=" + rawToken;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(reader.getEmail());
        message.setSubject("Redefina sua senha do Readva");
        message.setText("Olá, " + reader.getDisplayName() + ".\n\n"
                + "Recebemos um pedido para redefinir sua senha. Use o link abaixo em até 20 minutos:\n\n"
                + resetUrl + "\n\nSe você não pediu essa alteração, ignore esta mensagem.");

        try {
            mailSender.send(message);
        } catch (RuntimeException exception) {
            logger.warn("Could not send a password reset email.", exception);
            resetToken.consume();
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.",
                    exception);
        }
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }
}
