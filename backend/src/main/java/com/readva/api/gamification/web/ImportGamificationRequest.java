package com.readva.api.gamification.web;

import com.readva.api.gamification.application.ImportGamificationCommand;
import com.readva.api.shared.domain.InvalidRequestException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record ImportGamificationRequest(
        @Valid ReaderGoalValuesRequest goals,
        @NotBlank @Size(max = 80) String timeZone,
        @PositiveOrZero int totalXp,
        @Size(max = 4000) List<LocalDate> markedDays,
        @Size(max = 4000) Map<String, List<String>> missionHistory,
        @Size(max = 500) List<String> unseenMissionKeys,
        @Size(max = 100) List<String> achievementIds,
        @Size(max = 2000) List<String> rewardedBookIds) {
    ImportGamificationCommand toCommand() {
        Map<LocalDate, List<String>> parsedHistory = new LinkedHashMap<>();
        if (missionHistory != null) {
            missionHistory.forEach((date, missionIds) -> {
                try {
                    parsedHistory.put(LocalDate.parse(date), missionIds);
                } catch (RuntimeException exception) {
                    throw new InvalidRequestException("O histórico contém uma data inválida.");
                }
            });
        }
        return new ImportGamificationCommand(
                goals == null ? null : goals.toGoals(),
                timeZone,
                totalXp,
                markedDays,
                parsedHistory,
                unseenMissionKeys,
                achievementIds,
                rewardedBookIds);
    }
}
