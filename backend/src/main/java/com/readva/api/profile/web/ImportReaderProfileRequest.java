package com.readva.api.profile.web;

import com.readva.api.profile.application.ImportReaderProfileCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

public record ImportReaderProfileRequest(
        @Size(max = 280) String bio, @Valid AvatarConfigurationRequest avatar) {
    ImportReaderProfileCommand toCommand() {
        return new ImportReaderProfileCommand(bio, avatar == null ? null : avatar.toDomain());
    }
}
