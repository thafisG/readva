package com.readva.api.shared.web;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(Instant timestamp, int status, String message, Map<String, String> fields) {}
