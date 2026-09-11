package com.readva.api.gamification.web;

import com.readva.api.gamification.domain.ReaderGoals;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ReaderGoalValuesRequest(
        @Min(5) @Max(600) int dailyMinutes,
        @Min(1) @Max(50) int monthlyBooks) {
    ReaderGoals toGoals() {
        return new ReaderGoals(dailyMinutes, monthlyBooks);
    }
}