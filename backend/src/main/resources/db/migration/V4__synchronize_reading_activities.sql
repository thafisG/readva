ALTER TABLE reading_activity ADD COLUMN client_id VARCHAR(160);
ALTER TABLE reading_activity ADD COLUMN book_author VARCHAR(160) NOT NULL DEFAULT 'Autor desconhecido';
ALTER TABLE reading_activity ADD COLUMN book_category VARCHAR(100);
ALTER TABLE reading_activity ADD COLUMN action_type VARCHAR(32) NOT NULL DEFAULT 'PROGRESS';
ALTER TABLE reading_activity ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

UPDATE reading_activity
SET client_id = CAST(id AS VARCHAR(160)),
    updated_at = created_at;

ALTER TABLE reading_activity ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE reading_activity ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE reading_activity
    ADD CONSTRAINT uq_reading_activity_client_id UNIQUE (reader_id, client_id);

ALTER TABLE reading_activity
    ADD CONSTRAINT ck_reading_activity_action_type
        CHECK (action_type IN ('PROGRESS', 'FINISHED', 'STARTED'));

CREATE INDEX idx_reading_activity_reader_updated
    ON reading_activity (reader_id, updated_at DESC);
