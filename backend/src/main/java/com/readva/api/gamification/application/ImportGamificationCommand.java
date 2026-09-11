package com.readva.api.gamification.application;

import com.readva.api.gamification.domain.ReaderGoals;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ImportGamificationCommand(
        ReaderGoals goals,
        String timeZone,
        int totalXp,
        List<LocalDate> markedDays,
        Map<LocalDate, List<String>> missionHistory,
        List<String> unseenMissionKeys,
        List<String> achievementIds,
        List<String> rewardedBookIds) {}
