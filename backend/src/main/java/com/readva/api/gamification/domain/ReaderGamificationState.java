package com.readva.api.gamification.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ReaderGamificationState(
        ReaderGoals goals,
        String timeZone,
        boolean localMigrationCompleted,
        int totalXp,
        LocalDate missionsDay,
        List<DailyMissionProgress> missions,
        List<LocalDate> markedDays,
        Map<LocalDate, List<String>> missionHistory,
        List<String> unseenMissionKeys,
        List<String> achievementIds,
        List<String> rewardedBookIds) {}
