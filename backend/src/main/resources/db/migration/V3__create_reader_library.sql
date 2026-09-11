CREATE TABLE reader_book (
    id UUID PRIMARY KEY,
    reader_id UUID NOT NULL,
    client_id VARCHAR(160) NOT NULL,
    title VARCHAR(240) NOT NULL,
    author VARCHAR(160) NOT NULL,
    cover_url TEXT NOT NULL,
    total_pages INTEGER NOT NULL,
    current_page INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_reader_book_reader
        FOREIGN KEY (reader_id) REFERENCES reader_account (id) ON DELETE CASCADE,
    CONSTRAINT uq_reader_book_client_id UNIQUE (reader_id, client_id),
    CONSTRAINT ck_reader_book_pages
        CHECK (total_pages > 0 AND current_page >= 0 AND current_page <= total_pages),
    CONSTRAINT ck_reader_book_status
        CHECK (status IN ('WANT_TO_READ', 'READING', 'PAUSED', 'ABANDONED', 'COMPLETED'))
);

CREATE INDEX idx_reader_book_reader_status
    ON reader_book (reader_id, status, updated_at DESC);
