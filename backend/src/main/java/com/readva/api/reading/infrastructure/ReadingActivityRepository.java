package com.readva.api.reading.infrastructure;

import com.readva.api.reading.domain.ReadingActivity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingActivityRepository extends JpaRepository<ReadingActivity, UUID> {
    List<ReadingActivity> findAllByReader_IdOrderByOccurredOnDescCreatedAtDesc(UUID readerId);
}
