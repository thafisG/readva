package com.readva.api.profile.web;

import com.readva.api.profile.domain.AvatarConfiguration;
import com.readva.api.profile.domain.ReaderProfileState;
import java.time.Instant;
import java.util.UUID;

public record ReaderProfileResponse(
        UUID readerId,
        String displayName,
        String email,
        String bio,
        AvatarConfiguration avatar,
        boolean localMigrationCompleted,
        Instant updatedAt) {
    static ReaderProfileResponse from(ReaderProfileState state) {
        return new ReaderProfileResponse(
                state.readerId(),
                state.displayName(),
                state.email(),
                state.bio(),
                state.avatar(),
                state.localMigrationCompleted(),
                state.updatedAt());
    }
}
