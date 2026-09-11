package com.readva.api.gamification.domain;

import java.time.LocalDate;
import java.util.List;

public record DailyMissionDefinition(String id, int target, int xpReward) {
    private static final int[] PAGE_TARGETS = {10, 15, 20, 30};
    private static final int[] PAGE_REWARDS = {35, 45, 50, 70};
    private static final int[] MINUTE_TARGETS = {10, 15, 20, 30};
    private static final int[] MINUTE_REWARDS = {35, 45, 50, 60};

    public static List<DailyMissionDefinition> forDate(LocalDate date) {
        int seed = date.toString().chars()
                .filter(Character::isDigit)
                .map(character -> character - '0')
                .sum();
        int pageIndex = seed % PAGE_TARGETS.length;
        int minuteIndex = (seed + 1) % MINUTE_TARGETS.length;
        int sessionTarget = seed % 3 == 0 ? 2 : 1;
        return List.of(
                new DailyMissionDefinition(
                        "read-pages", PAGE_TARGETS[pageIndex], PAGE_REWARDS[pageIndex]),
                new DailyMissionDefinition(
                        "read-minutes", MINUTE_TARGETS[minuteIndex], MINUTE_REWARDS[minuteIndex]),
                new DailyMissionDefinition(
                        "read-session", sessionTarget, sessionTarget == 1 ? 30 : 55),
                new DailyMissionDefinition("start-book", 1, 40));
    }

    public int progress(DailyReadingTotals totals, boolean explicitlyCompleted) {
        if (explicitlyCompleted && id.equals("start-book")) return target;
        return switch (id) {
            case "read-pages" -> totals.pages();
            case "read-minutes" -> totals.minutes();
            case "read-session" -> totals.sessions();
            default -> 0;
        };
    }
}
