package com.readva.api.reading.domain;

import com.readva.api.account.domain.ReaderAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reading_activity")
public class ReadingActivity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reader_id", nullable = false)
    private ReaderAccount reader;

    @Column(name = "book_reference", nullable = false, length = 160)
    private String bookReference;

    @Column(name = "book_title", nullable = false, length = 240)
    private String bookTitle;

    @Column(name = "pages_read", nullable = false)
    private int pagesRead;

    @Column(name = "minutes_read", nullable = false)
    private int minutesRead;

    @Column(length = 1000)
    private String note;

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ReadingActivity() {}

    public ReadingActivity(
            ReaderAccount reader,
            String bookReference,
            String bookTitle,
            int pagesRead,
            int minutesRead,
            String note,
            LocalDate occurredOn) {
        this.id = UUID.randomUUID();
        this.reader = reader;
        this.bookReference = bookReference.trim();
        this.bookTitle = bookTitle.trim();
        this.pagesRead = pagesRead;
        this.minutesRead = minutesRead;
        this.note = note == null || note.isBlank() ? null : note.trim();
        this.occurredOn = occurredOn;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getReaderId() { return reader.getId(); }
    public String getBookReference() { return bookReference; }
    public String getBookTitle() { return bookTitle; }
    public int getPagesRead() { return pagesRead; }
    public int getMinutesRead() { return minutesRead; }
    public String getNote() { return note; }
    public LocalDate getOccurredOn() { return occurredOn; }
    public Instant getCreatedAt() { return createdAt; }
}
