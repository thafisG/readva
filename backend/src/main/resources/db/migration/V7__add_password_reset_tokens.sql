CREATE TABLE password_reset_token (
    id UUID PRIMARY KEY,
    reader_id UUID NOT NULL REFERENCES reader_account(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_password_reset_token_reader_id ON password_reset_token(reader_id);
