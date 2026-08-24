CREATE TABLE reader_account (
    id UUID PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    normalized_email VARCHAR(254) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE reading_activity (
    id UUID PRIMARY KEY,
    reader_id UUID NOT NULL,
    book_reference VARCHAR(160) NOT NULL,
    book_title VARCHAR(240) NOT NULL,
    pages_read INTEGER NOT NULL DEFAULT 0,
    minutes_read INTEGER NOT NULL DEFAULT 0,
    note VARCHAR(1000),
    occurred_on DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_reading_activity_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE,
    CONSTRAINT ck_reading_activity_progress
        CHECK (pages_read > 0 OR minutes_read > 0)
);

CREATE INDEX idx_reading_activity_reader_date
    ON reading_activity (reader_id, occurred_on DESC, created_at DESC);

CREATE TABLE daily_goal (
    reader_id UUID PRIMARY KEY,
    pages_target INTEGER NOT NULL DEFAULT 0,
    minutes_target INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_daily_goal_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE,
    CONSTRAINT ck_daily_goal_target
        CHECK (pages_target > 0 OR minutes_target > 0)
);

CREATE TABLE streak_day (
    reader_id UUID NOT NULL,
    streak_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (reader_id, streak_date),
    CONSTRAINT fk_streak_day_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE
);

CREATE TABLE mission_completion (
    reader_id UUID NOT NULL,
    mission_key VARCHAR(120) NOT NULL,
    mission_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (reader_id, mission_key, mission_date),
    CONSTRAINT fk_mission_completion_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE
);

CREATE INDEX idx_mission_completion_reader_date
    ON mission_completion (reader_id, mission_date DESC);
