package com.readva.api.shared.domain;

public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) { super(message); }
}
