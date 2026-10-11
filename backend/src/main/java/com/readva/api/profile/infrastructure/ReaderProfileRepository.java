package com.readva.api.profile.infrastructure;

import com.readva.api.profile.domain.ReaderProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReaderProfileRepository extends JpaRepository<ReaderProfile, UUID> {}
