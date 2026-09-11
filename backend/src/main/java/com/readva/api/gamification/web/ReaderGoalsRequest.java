package com.readva.api.gamification.web;

import com.readva.api.gamification.domain.ReaderGoals;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReaderGoalsRequest(
        @Min(5) @Max(600) int dailyMinutes,
        @Min(1) @Max(50) int monthlyBooks,
        @NotBlank @Size(max = 80) String timeZone) {
    ReaderGoals toGoals() {
        return new ReaderGoals(dailyMinutes, monthlyBooks);
    }
}
