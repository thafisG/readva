package com.readva.api.gamification.web;

import com.readva.api.gamification.domain.DailyMissionProgress;
import com.readva.api.gamification.domain.ReaderGamificationState;
import com.readva.api.gamification.domain.ReaderGoals;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ReaderGamificationResponse(
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
        List<String> rewardedBookIds) {
    static ReaderGamificationResponse from(ReaderGamificationState state) {
        return new ReaderGamificationResponse(
                state.goals(),
                state.timeZone(),
                state.localMigrationCompleted(),
                state.totalXp(),
                state.missionsDay(),
                state.missions(),
                state.markedDays(),
                state.missionHistory(),
                state.unseenMissionKeys(),
                state.achievementIds(),
                state.rewardedBookIds());
    }
}
