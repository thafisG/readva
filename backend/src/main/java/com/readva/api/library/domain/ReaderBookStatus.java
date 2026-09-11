package com.readva.api.library.domain;

import com.readva.api.shared.domain.InvalidRequestException;

public enum ReaderBookStatus {
    WANT_TO_READ("want-to-read"),
    READING("reading"),
    PAUSED("paused"),
    ABANDONED("abandoned"),
    COMPLETED("completed");

    private final String apiValue;

    ReaderBookStatus(String apiValue) {
        this.apiValue = apiValue;
    }

    public String apiValue() {
        return apiValue;
    }

    public static ReaderBookStatus fromApiValue(String value) {
        if (value != null) {
            for (ReaderBookStatus status : values()) {
                if (status.apiValue.equals(value.trim())) return status;
            }
        }
        throw new InvalidRequestException("Status de livro inválido.");
    }
}
