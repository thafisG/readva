package com.readva.api.account.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReaderRequest(
        @NotBlank @Size(max = 100) String displayName,
        @NotBlank @Email @Size(max = 254) String email) {}
