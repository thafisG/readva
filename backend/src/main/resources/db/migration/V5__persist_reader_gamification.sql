ALTER TABLE daily_goal ADD COLUMN monthly_books_target INTEGER NOT NULL DEFAULT 2;
ALTER TABLE daily_goal
    ADD CONSTRAINT ck_daily_goal_monthly_books CHECK (monthly_books_target BETWEEN 1 AND 50);

ALTER TABLE streak_day ADD COLUMN manual BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE mission_completion ADD COLUMN seen_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE reader_gamification_profile (
    reader_id UUID PRIMARY KEY,
    total_xp INTEGER NOT NULL DEFAULT 0,
    time_zone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    local_migration_completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_gamification_profile_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE,
    CONSTRAINT ck_gamification_total_xp CHECK (total_xp >= 0)
);

CREATE TABLE achievement_unlock (
    reader_id UUID NOT NULL,
    achievement_key VARCHAR(120) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (reader_id, achievement_key),
    CONSTRAINT fk_achievement_unlock_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE
);

CREATE TABLE rewarded_book (
    reader_id UUID NOT NULL,
    book_client_id VARCHAR(160) NOT NULL,
    rewarded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (reader_id, book_client_id),
    CONSTRAINT fk_rewarded_book_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE
);

CREATE INDEX idx_streak_day_reader_date_desc
    ON streak_day (reader_id, streak_date DESC);
