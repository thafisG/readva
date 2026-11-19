package com.readva.api.auth.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmationRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 72) String password) {}
