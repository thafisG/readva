package com.readva.api.profile.application;

import com.readva.api.profile.domain.AvatarConfiguration;

public record ImportReaderProfileCommand(String bio, AvatarConfiguration avatar) {}
