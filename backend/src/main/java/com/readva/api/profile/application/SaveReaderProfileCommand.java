package com.readva.api.profile.application;

import com.readva.api.profile.domain.AvatarConfiguration;

public record SaveReaderProfileCommand(
        String displayName, String bio, AvatarConfiguration avatar) {}
