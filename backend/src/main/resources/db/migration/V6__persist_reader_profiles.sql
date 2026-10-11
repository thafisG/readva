CREATE TABLE reader_profile (
    reader_id UUID PRIMARY KEY,
    bio VARCHAR(280),
    avatar_skin_tone VARCHAR(20),
    avatar_hair_style VARCHAR(20),
    avatar_hair_color VARCHAR(20),
    avatar_shirt_color VARCHAR(20),
    avatar_accessory VARCHAR(20),
    local_migration_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_reader_profile_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account(id) ON DELETE CASCADE
);
