package com.readva.api.reading.domain;

import com.readva.api.shared.domain.InvalidRequestException;

public enum ReadingActivityType {
    PROGRESS("progress"),
    FINISHED("finished"),
    STARTED("started");

    private final String apiValue;

    ReadingActivityType(String apiValue) {
        this.apiValue = apiValue;
    }

    public String apiValue() {
        return apiValue;
    }

    public static ReadingActivityType fromApiValue(String value) {
        if (value != null) {
            for (ReadingActivityType type : values()) {
                if (type.apiValue.equalsIgnoreCase(value.trim())) {
                    return type;
                }
            }
        }
        throw new InvalidRequestException("Tipo de atividade inválido.");
    }
}
