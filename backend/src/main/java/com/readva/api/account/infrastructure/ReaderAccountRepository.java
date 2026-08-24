package com.readva.api.account.infrastructure;

import com.readva.api.account.domain.ReaderAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReaderAccountRepository extends JpaRepository<ReaderAccount, UUID> {
    boolean existsByNormalizedEmail(String normalizedEmail);

    Optional<ReaderAccount> findByNormalizedEmail(String normalizedEmail);
}
