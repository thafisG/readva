package com.readva.api.gamification.application;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.gamification.domain.DailyMissionDefinition;
import com.readva.api.gamification.domain.DailyMissionProgress;
import com.readva.api.gamification.domain.DailyReadingTotals;
import com.readva.api.gamification.domain.GamificationEventType;
import com.readva.api.gamification.domain.ReaderGamificationState;
import com.readva.api.gamification.domain.ReaderGoals;
import com.readva.api.gamification.infrastructure.GamificationRepository;
import com.readva.api.reading.domain.ReadingActivity;
import com.readva.api.shared.domain.InvalidRequestException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GamificationService {
    private static final ReaderGoals DEFAULT_GOALS = new ReaderGoals(60, 2);
    private static final Set<String> ACHIEVEMENT_IDS = Set.of(
            "first-book",
            "streak-7",
            "streak-30",
            "level-5",
            "level-10",
            "night-owl",
            "first-mission",
            "all-missions");

    private final GamificationRepository repository;
    private final ReaderAccountService readerAccountService;

    public GamificationService(
            GamificationRepository repository, ReaderAccountService readerAccountService) {
        this.repository = repository;
        this.readerAccountService = readerAccountService;
    }

    @Transactional(readOnly = true)
    public ReaderGamificationState get(UUID readerId) {
        readerAccountService.findById(readerId);
        return snapshot(readerId);
    }

    @Transactional
    public ReaderGamificationState saveGoals(
            UUID readerId, ReaderGoals goals, String timeZone) {
        readerAccountService.findById(readerId);
        ReaderGoals validGoals = validateGoals(goals);
        String validZone = validateTimeZone(timeZone);
        repository.saveGoals(readerId, validGoals);
        repository.updateTimeZone(readerId, validZone);
        return snapshot(readerId);
    }

    @Transactional
    public ReaderGamificationState importState(UUID readerId, ImportGamificationCommand command) {
        readerAccountService.findById(readerId);
        ReaderGoals goals = validateGoals(command.goals() == null ? DEFAULT_GOALS : command.goals());
        String timeZone = validateTimeZone(command.timeZone());
        repository.saveGoals(readerId, goals);
        repository.updateTimeZone(readerId, timeZone);

        safeDates(command.markedDays(), 4_000)
                .forEach(date -> repository.markDay(readerId, date, true));
        Set<String> unseen = new HashSet<>(safeStrings(command.unseenMissionKeys(), 500, 140));
        Map<LocalDate, List<String>> history =
                command.missionHistory() == null ? Map.of() : command.missionHistory();
        if (history.size() > 4_000) {
            throw new InvalidRequestException("O histórico de missões excede o limite permitido.");
        }
        history.forEach((date, missionIds) -> safeStrings(missionIds, 20, 120).forEach(missionId -> {
            if (!isKnownMission(date, missionId)) return;
            boolean created = repository.recordMissionCompletion(
                    readerId, missionId, date, unseen.contains(date + ":" + missionId));
            if (created) repository.addXp(readerId, rewardFor(date, missionId));
        }));
        repository.setTotalXpAtLeast(readerId, Math.max(0, command.totalXp()));

        safeStrings(command.achievementIds(), 100, 120).stream()
                .filter(ACHIEVEMENT_IDS::contains)
                .forEach(id -> repository.unlockAchievement(readerId, id));
        safeStrings(command.rewardedBookIds(), 2_000, 160)
                .forEach(id -> repository.rewardBook(readerId, id));
        ensureDerivedAchievements(readerId);
        repository.markLocalMigrationCompleted(readerId);
        return snapshot(readerId);
    }

    @Transactional
    public ReaderGamificationState markDay(UUID readerId, LocalDate date) {
        readerAccountService.findById(readerId);
        repository.markDay(readerId, requireDate(date), true);
        ensureStreakAchievements(readerId);
        return snapshot(readerId);
    }

    @Transactional
    public ReaderGamificationState unmarkDay(UUID readerId, LocalDate date) {
        readerAccountService.findById(readerId);
        repository.unmarkManualDay(readerId, requireDate(date));
        return snapshot(readerId);
    }

    @Transactional
    public ReaderGamificationState markMissionsSeen(UUID readerId, List<String> keys) {
        readerAccountService.findById(readerId);
        repository.markMissionsSeen(readerId, safeStrings(keys, 100, 140));
        return snapshot(readerId);
    }

    @Transactional
    public ReaderGamificationState recordEvent(
            UUID readerId,
            GamificationEventType eventType,
            String bookId,
            LocalDate occurredOn) {
        readerAccountService.findById(readerId);
        applyEvent(readerId, eventType, bookId, requireDate(occurredOn));
        ensureDerivedAchievements(readerId);
        return snapshot(readerId);
    }

    @Transactional
    public void recordBookEvent(
            UUID readerId, GamificationEventType eventType, String bookId, LocalDate occurredOn) {
        readerAccountService.findById(readerId);
        if (eventType != GamificationEventType.BOOK_STARTED
                && eventType != GamificationEventType.BOOK_FINISHED) {
            throw new InvalidRequestException("Evento de livro inválido.");
        }
        applyEvent(readerId, eventType, bookId, requireDate(occurredOn));
        ensureDerivedAchievements(readerId);
    }

    @Transactional
    public void reconcileReading(
            UUID readerId, ReadingActivity activity, LocalDate previousDate) {
        if (previousDate != null && !previousDate.equals(activity.getOccurredOn())) {
            reconcileDate(readerId, previousDate);
        }
        reconcileDate(readerId, activity.getOccurredOn());
        unlockNightAchievement(readerId, activity.getCreatedAt());
    }

    @Transactional
    public void reconcileDate(UUID readerId, LocalDate date) {
        if (repository.hasReadingOn(readerId, date)) {
            repository.markDay(readerId, date, false);
            DailyReadingTotals totals = repository.readingTotals(readerId, date);
            for (DailyMissionDefinition mission : DailyMissionDefinition.forDate(date)) {
                if (mission.progress(totals, repository.missionCompleted(readerId, mission.id(), date))
                        >= mission.target()) {
                    completeMission(readerId, date, mission.id());
                }
            }
        } else {
            repository.removeDerivedDayWithoutReading(readerId, date);
        }
        ensureDerivedAchievements(readerId);
    }

    private ReaderGamificationState snapshot(UUID readerId) {
        String timeZone = repository.findTimeZone(readerId);
        ZoneId zone = ZoneId.of(timeZone);
        LocalDate today = LocalDate.now(zone);
        DailyReadingTotals totals = repository.readingTotals(readerId, today);
        List<DailyMissionProgress> missions = DailyMissionDefinition.forDate(today).stream()
                .map(definition -> {
                    boolean completed = repository.missionCompleted(readerId, definition.id(), today);
                    int progress = Math.min(
                            definition.target(), definition.progress(totals, completed));
                    return new DailyMissionProgress(
                            definition.id(),
                            progress,
                            definition.target(),
                            definition.xpReward(),
                            completed || progress >= definition.target());
                })
                .toList();
        return new ReaderGamificationState(
                repository.findGoals(readerId).orElse(DEFAULT_GOALS),
                timeZone,
                repository.isLocalMigrationCompleted(readerId),
                repository.findTotalXp(readerId),
                today,
                missions,
                repository.findMarkedDays(readerId),
                repository.findMissionHistory(readerId),
                repository.findUnseenMissionKeys(readerId),
                repository.findAchievementIds(readerId),
                repository.findRewardedBookIds(readerId));
    }

    private void applyEvent(
            UUID readerId, GamificationEventType eventType, String bookId, LocalDate date) {
        switch (eventType) {
            case BOOK_STARTED -> completeMission(readerId, date, "start-book");
            case BOOK_FINISHED -> {
                String normalizedBookId = requireText(bookId, "livro", 160);
                if (repository.rewardBook(readerId, normalizedBookId)) {
                    repository.unlockAchievement(readerId, "first-book");
                }
            }
            case NIGHT_READING -> repository.unlockAchievement(readerId, "night-owl");
        }
    }

    private void completeMission(UUID readerId, LocalDate date, String missionId) {
        DailyMissionDefinition definition = DailyMissionDefinition.forDate(date).stream()
                .filter(candidate -> candidate.id().equals(missionId))
                .findFirst()
                .orElse(null);
        if (definition == null) return;
        if (repository.recordMissionCompletion(readerId, missionId, date, true)) {
            repository.addXp(readerId, definition.xpReward());
            repository.unlockAchievement(readerId, "first-mission");
            if (repository.missionCompletionCount(readerId, date) >= 4) {
                repository.unlockAchievement(readerId, "all-missions");
            }
        }
    }

    private void unlockNightAchievement(UUID readerId, Instant occurredAt) {
        ZoneId zone = ZoneId.of(repository.findTimeZone(readerId));
        ZonedDateTime localTime = occurredAt.atZone(zone);
        if (localTime.getHour() >= 22 || localTime.getHour() < 5) {
            repository.unlockAchievement(readerId, "night-owl");
        }
    }

    private void ensureDerivedAchievements(UUID readerId) {
        ensureStreakAchievements(readerId);
        int level = calculateLevel(repository.findTotalXp(readerId));
        if (level >= 5) repository.unlockAchievement(readerId, "level-5");
        if (level >= 10) repository.unlockAchievement(readerId, "level-10");
    }

    private void ensureStreakAchievements(UUID readerId) {
        int longestStreak = longestStreak(repository.findMarkedDays(readerId));
        if (longestStreak >= 7) repository.unlockAchievement(readerId, "streak-7");
        if (longestStreak >= 30) repository.unlockAchievement(readerId, "streak-30");
    }

    private int longestStreak(List<LocalDate> dates) {
        int longest = 0;
        int current = 0;
        LocalDate previous = null;
        for (LocalDate date : dates) {
            current = previous != null && date.equals(previous.plusDays(1)) ? current + 1 : 1;
            longest = Math.max(longest, current);
            previous = date;
        }
        return longest;
    }

    private int calculateLevel(int totalXp) {
        int remaining = Math.max(0, totalXp);
        int level = 1;
        while (remaining >= 100 + Math.max(0, level - 1) * 50) {
            remaining -= 100 + Math.max(0, level - 1) * 50;
            level++;
        }
        return level;
    }

    private int rewardFor(LocalDate date, String missionId) {
        return DailyMissionDefinition.forDate(date).stream()
                .filter(mission -> mission.id().equals(missionId))
                .map(DailyMissionDefinition::xpReward)
                .findFirst()
                .orElse(0);
    }

    private boolean isKnownMission(LocalDate date, String missionId) {
        return DailyMissionDefinition.forDate(date).stream()
                .anyMatch(mission -> mission.id().equals(missionId));
    }

    private ReaderGoals validateGoals(ReaderGoals goals) {
        if (goals.dailyMinutes() < 5 || goals.dailyMinutes() > 600) {
            throw new InvalidRequestException("A meta diária deve ficar entre 5 e 600 minutos.");
        }
        if (goals.monthlyBooks() < 1 || goals.monthlyBooks() > 50) {
            throw new InvalidRequestException("A meta mensal deve ficar entre 1 e 50 livros.");
        }
        return goals;
    }

    private String validateTimeZone(String timeZone) {
        String normalized = timeZone == null || timeZone.isBlank() ? "UTC" : timeZone.trim();
        if (normalized.length() > 80) {
            throw new InvalidRequestException("O fuso horário informado é inválido.");
        }
        try {
            ZoneId.of(normalized);
            return normalized;
        } catch (RuntimeException exception) {
            throw new InvalidRequestException("O fuso horário informado é inválido.");
        }
    }

    private LocalDate requireDate(LocalDate date) {
        if (date == null) throw new InvalidRequestException("Informe a data do evento.");
        return date;
    }

    private String requireText(String value, String field, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException("Informe o " + field + ".");
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new InvalidRequestException("O campo " + field + " excede o tamanho permitido.");
        }
        return normalized;
    }

    private List<String> safeStrings(List<String> values, int maxItems, int maxLength) {
        if (values == null) return List.of();
        if (values.size() > maxItems) {
            throw new InvalidRequestException("A importação de gamificação excede o limite permitido.");
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank() && value.length() <= maxLength)
                .map(String::trim)
                .distinct()
                .toList();
    }

    private List<LocalDate> safeDates(List<LocalDate> values, int maxItems) {
        if (values == null) return List.of();
        if (values.size() > maxItems) {
            throw new InvalidRequestException("A importação de dias ativos excede o limite permitido.");
        }
        return values.stream().distinct().sorted().toList();
    }
}
