package com.readva.api.profile.domain;

import java.time.Instant;
import java.util.UUID;

public record ReaderProfileState(
        UUID readerId,
        String displayName,
        String email,
        String bio,
        AvatarConfiguration avatar,
        boolean localMigrationCompleted,
        Instant updatedAt) {}
