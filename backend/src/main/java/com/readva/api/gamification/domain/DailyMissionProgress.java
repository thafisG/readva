package com.readva.api.gamification.domain;

public record DailyMissionProgress(
        String id, int progress, int target, int xpReward, boolean completed) {}
