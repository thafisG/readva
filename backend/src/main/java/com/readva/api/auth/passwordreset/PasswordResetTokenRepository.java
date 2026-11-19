package com.readva.api.auth.passwordreset;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHashAndConsumedAtIsNull(String tokenHash);

    void deleteByReader_IdAndConsumedAtIsNull(UUID readerId);
}
