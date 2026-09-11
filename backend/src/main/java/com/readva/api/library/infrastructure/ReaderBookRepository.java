package com.readva.api.library.infrastructure;

import com.readva.api.library.domain.ReaderBook;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReaderBookRepository extends JpaRepository<ReaderBook, UUID> {
    List<ReaderBook> findAllByReader_IdOrderByCreatedAtDesc(UUID readerId);
    Optional<ReaderBook> findByReader_IdAndClientId(UUID readerId, String clientId);
}
