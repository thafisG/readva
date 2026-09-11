package com.readva.api.gamification.domain;

import com.readva.api.shared.domain.InvalidRequestException;

public enum GamificationEventType {
    BOOK_STARTED,
    BOOK_FINISHED,
    NIGHT_READING;

    public static GamificationEventType fromApiValue(String value) {
        if (value != null) {
            try {
                return valueOf(value.trim().replace('-', '_').toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // The domain error below keeps the public response stable.
            }
        }
        throw new InvalidRequestException("Evento de gamificação inválido.");
    }
}
