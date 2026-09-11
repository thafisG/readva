package com.readva.api.gamification.infrastructure;

import com.readva.api.gamification.domain.DailyReadingTotals;
import com.readva.api.gamification.domain.ReaderGoals;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GamificationRepository {
    private final JdbcTemplate jdbc;

    public GamificationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<ReaderGoals> findGoals(UUID readerId) {
        return jdbc.query(
                        "SELECT minutes_target, monthly_books_target FROM daily_goal WHERE reader_id = ?",
                        (row, index) -> new ReaderGoals(
                                row.getInt("minutes_target"), row.getInt("monthly_books_target")),
                        readerId)
                .stream()
                .findFirst();
    }

    public void saveGoals(UUID readerId, ReaderGoals goals) {
        int updated = jdbc.update(
                "UPDATE daily_goal SET minutes_target = ?, monthly_books_target = ?, updated_at = ? WHERE reader_id = ?",
                goals.dailyMinutes(),
                goals.monthlyBooks(),
                Timestamp.from(Instant.now()),
                readerId);
        if (updated == 0) {
            jdbc.update(
                    "INSERT INTO daily_goal (reader_id, pages_target, minutes_target, monthly_books_target, updated_at) VALUES (?, 0, ?, ?, ?)",
                    readerId,
                    goals.dailyMinutes(),
                    goals.monthlyBooks(),
                    Timestamp.from(Instant.now()));
        }
    }

    public void ensureProfile(UUID readerId, String timeZone) {
        jdbc.update(
                "INSERT INTO reader_gamification_profile (reader_id, total_xp, time_zone, updated_at) VALUES (?, 0, ?, ?) ON CONFLICT DO NOTHING",
                readerId,
                timeZone,
                Timestamp.from(Instant.now()));
    }

    public String findTimeZone(UUID readerId) {
        return jdbc.query(
                        "SELECT time_zone FROM reader_gamification_profile WHERE reader_id = ?",
                        (row, index) -> row.getString("time_zone"),
                        readerId)
                .stream()
                .findFirst()
                .orElse("UTC");
    }

    public boolean isLocalMigrationCompleted(UUID readerId) {
        return jdbc.query(
                        "SELECT local_migration_completed FROM reader_gamification_profile WHERE reader_id = ?",
                        (row, index) -> row.getBoolean("local_migration_completed"),
                        readerId)
                .stream()
                .findFirst()
                .orElse(false);
    }

    public void markLocalMigrationCompleted(UUID readerId) {
        ensureProfile(readerId, "UTC");
        jdbc.update(
                "UPDATE reader_gamification_profile SET local_migration_completed = TRUE, updated_at = ? WHERE reader_id = ?",
                Timestamp.from(Instant.now()),
                readerId);
    }

    public int findTotalXp(UUID readerId) {
        return jdbc.query(
                        "SELECT total_xp FROM reader_gamification_profile WHERE reader_id = ?",
                        (row, index) -> row.getInt("total_xp"),
                        readerId)
                .stream()
                .findFirst()
                .orElse(0);
    }

    public void updateTimeZone(UUID readerId, String timeZone) {
        ensureProfile(readerId, timeZone);
        jdbc.update(
                "UPDATE reader_gamification_profile SET time_zone = ?, updated_at = ? WHERE reader_id = ?",
                timeZone,
                Timestamp.from(Instant.now()),
                readerId);
    }

    public void setTotalXpAtLeast(UUID readerId, int totalXp) {
        ensureProfile(readerId, "UTC");
        jdbc.update(
                "UPDATE reader_gamification_profile SET total_xp = CASE WHEN total_xp < ? THEN ? ELSE total_xp END, updated_at = ? WHERE reader_id = ?",
                totalXp,
                totalXp,
                Timestamp.from(Instant.now()),
                readerId);
    }

    public void addXp(UUID readerId, int xp) {
        ensureProfile(readerId, "UTC");
        jdbc.update(
                "UPDATE reader_gamification_profile SET total_xp = total_xp + ?, updated_at = ? WHERE reader_id = ?",
                xp,
                Timestamp.from(Instant.now()),
                readerId);
    }

    public List<LocalDate> findMarkedDays(UUID readerId) {
        return jdbc.query(
                "SELECT streak_date FROM streak_day WHERE reader_id = ? ORDER BY streak_date",
                (row, index) -> row.getObject("streak_date", LocalDate.class),
                readerId);
    }

    public void markDay(UUID readerId, LocalDate date, boolean manual) {
        int updated = manual
                ? jdbc.update(
                        "UPDATE streak_day SET manual = TRUE WHERE reader_id = ? AND streak_date = ?",
                        readerId,
                        Date.valueOf(date))
                : 0;
        if (updated == 0
                && !exists(
                        "SELECT COUNT(*) FROM streak_day WHERE reader_id = ? AND streak_date = ?",
                        readerId,
                        Date.valueOf(date))) {
            jdbc.update(
                    "INSERT INTO streak_day (reader_id, streak_date, created_at, manual) VALUES (?, ?, ?, ?)",
                    readerId,
                    Date.valueOf(date),
                    Timestamp.from(Instant.now()),
                    manual);
        }
    }

    public void unmarkManualDay(UUID readerId, LocalDate date) {
        if (hasReadingOn(readerId, date)) {
            jdbc.update(
                    "UPDATE streak_day SET manual = FALSE WHERE reader_id = ? AND streak_date = ?",
                    readerId,
                    Date.valueOf(date));
        } else {
            jdbc.update(
                    "DELETE FROM streak_day WHERE reader_id = ? AND streak_date = ?",
                    readerId,
                    Date.valueOf(date));
        }
    }

    public void removeDerivedDayWithoutReading(UUID readerId, LocalDate date) {
        if (!hasReadingOn(readerId, date)) {
            jdbc.update(
                    "DELETE FROM streak_day WHERE reader_id = ? AND streak_date = ? AND manual = FALSE",
                    readerId,
                    Date.valueOf(date));
        }
    }

    public boolean hasReadingOn(UUID readerId, LocalDate date) {
        return exists(
                "SELECT COUNT(*) FROM reading_activity WHERE reader_id = ? AND occurred_on = ?",
                readerId,
                Date.valueOf(date));
    }

    public DailyReadingTotals readingTotals(UUID readerId, LocalDate date) {
        return jdbc.queryForObject(
                "SELECT COALESCE(SUM(pages_read), 0) AS pages, COALESCE(SUM(minutes_read), 0) AS minutes, COUNT(*) AS sessions FROM reading_activity WHERE reader_id = ? AND occurred_on = ? AND action_type = 'PROGRESS'",
                (row, index) -> new DailyReadingTotals(
                        row.getInt("pages"), row.getInt("minutes"), row.getInt("sessions")),
                readerId,
                Date.valueOf(date));
    }

    public boolean recordMissionCompletion(
            UUID readerId, String missionKey, LocalDate date, boolean unseen) {
        Instant now = Instant.now();
        return jdbc.update(
                        "INSERT INTO mission_completion (reader_id, mission_key, mission_date, completed_at, seen_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
                        readerId,
                        missionKey,
                        Date.valueOf(date),
                        Timestamp.from(now),
                        unseen ? null : Timestamp.from(now))
                > 0;
    }

    public boolean missionCompleted(UUID readerId, String missionKey, LocalDate date) {
        return exists(
                "SELECT COUNT(*) FROM mission_completion WHERE reader_id = ? AND mission_key = ? AND mission_date = ?",
                readerId,
                missionKey,
                Date.valueOf(date));
    }

    public int missionCompletionCount(UUID readerId, LocalDate date) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM mission_completion WHERE reader_id = ? AND mission_date = ?",
                Integer.class,
                readerId,
                Date.valueOf(date));
        return count == null ? 0 : count;
    }

    public Map<LocalDate, List<String>> findMissionHistory(UUID readerId) {
        Map<LocalDate, List<String>> history = new LinkedHashMap<>();
        jdbc.query(
                "SELECT mission_date, mission_key FROM mission_completion WHERE reader_id = ? ORDER BY mission_date, mission_key",
                (org.springframework.jdbc.core.RowCallbackHandler) row -> history
                        .computeIfAbsent(
                                row.getObject("mission_date", LocalDate.class), ignored -> new ArrayList<>())
                        .add(row.getString("mission_key")),
                readerId);
        return history;
    }

    public List<String> findUnseenMissionKeys(UUID readerId) {
        return jdbc.query(
                "SELECT mission_date, mission_key FROM mission_completion WHERE reader_id = ? AND seen_at IS NULL ORDER BY mission_date, mission_key",
                (row, index) -> row.getObject("mission_date", LocalDate.class)
                        + ":"
                        + row.getString("mission_key"),
                readerId);
    }

    public void markMissionsSeen(UUID readerId, List<String> compoundKeys) {
        for (String compoundKey : compoundKeys) {
            int separator = compoundKey.indexOf(':');
            if (separator <= 0) continue;
            LocalDate date;
            try {
                date = LocalDate.parse(compoundKey.substring(0, separator));
            } catch (RuntimeException ignored) {
                continue;
            }
            jdbc.update(
                    "UPDATE mission_completion SET seen_at = ? WHERE reader_id = ? AND mission_date = ? AND mission_key = ?",
                    Timestamp.from(Instant.now()),
                    readerId,
                    Date.valueOf(date),
                    compoundKey.substring(separator + 1));
        }
    }

    public List<String> findAchievementIds(UUID readerId) {
        return jdbc.query(
                "SELECT achievement_key FROM achievement_unlock WHERE reader_id = ? ORDER BY unlocked_at",
                (row, index) -> row.getString("achievement_key"),
                readerId);
    }

    public boolean unlockAchievement(UUID readerId, String achievementKey) {
        return jdbc.update(
                        "INSERT INTO achievement_unlock (reader_id, achievement_key, unlocked_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                        readerId,
                        achievementKey,
                        Timestamp.from(Instant.now()))
                > 0;
    }

    public List<String> findRewardedBookIds(UUID readerId) {
        return jdbc.query(
                "SELECT book_client_id FROM rewarded_book WHERE reader_id = ? ORDER BY rewarded_at",
                (row, index) -> row.getString("book_client_id"),
                readerId);
    }

    public boolean rewardBook(UUID readerId, String bookId) {
        return jdbc.update(
                        "INSERT INTO rewarded_book (reader_id, book_client_id, rewarded_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                        readerId,
                        bookId,
                        Timestamp.from(Instant.now()))
                > 0;
    }

    private boolean exists(String sql, Object... arguments) {
        Integer count = jdbc.queryForObject(sql, Integer.class, arguments);
        return count != null && count > 0;
    }
}
