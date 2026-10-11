package com.readva.api.profile.web;

import com.readva.api.profile.application.SaveReaderProfileCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveReaderProfileRequest(
        @NotBlank @Size(max = 100) String displayName,
        @Size(max = 280) String bio,
        @Valid AvatarConfigurationRequest avatar) {
    SaveReaderProfileCommand toCommand() {
        return new SaveReaderProfileCommand(
                displayName, bio, avatar == null ? null : avatar.toDomain());
    }
}
