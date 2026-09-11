package com.readva.api.reading.domain;

import com.readva.api.account.domain.ReaderAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @Column(name = "client_id", nullable = false, length = 160)
    private String clientId;

    @Column(name = "book_reference", nullable = false, length = 160)
    private String bookReference;

    @Column(name = "book_title", nullable = false, length = 240)
    private String bookTitle;

    @Column(name = "book_author", nullable = false, length = 160)
    private String bookAuthor;

    @Column(name = "book_category", length = 100)
    private String bookCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 32)
    private ReadingActivityType actionType;

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

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ReadingActivity() {}

    public ReadingActivity(
            ReaderAccount reader,
            String clientId,
            String bookReference,
            String bookTitle,
            String bookAuthor,
            String bookCategory,
            ReadingActivityType actionType,
            int pagesRead,
            int minutesRead,
            String note,
            LocalDate occurredOn,
            Instant createdAt,
            Instant updatedAt) {
        this.id = UUID.randomUUID();
        this.reader = reader;
        this.clientId = clientId;
        this.createdAt = createdAt == null ? Instant.now() : createdAt;
        replace(
                bookReference,
                bookTitle,
                bookAuthor,
                bookCategory,
                actionType,
                pagesRead,
                minutesRead,
                note,
                occurredOn,
                updatedAt);
    }

    public void replace(
            String bookReference,
            String bookTitle,
            String bookAuthor,
            String bookCategory,
            ReadingActivityType actionType,
            int pagesRead,
            int minutesRead,
            String note,
            LocalDate occurredOn,
            Instant updatedAt) {
        this.bookReference = bookReference;
        this.bookTitle = bookTitle;
        this.bookAuthor = bookAuthor;
        this.bookCategory = bookCategory;
        this.actionType = actionType;
        this.pagesRead = pagesRead;
        this.minutesRead = minutesRead;
        this.note = note;
        this.occurredOn = occurredOn;
        this.updatedAt = updatedAt == null ? Instant.now() : updatedAt;
    }

    public UUID getId() { return id; }
    public UUID getReaderId() { return reader.getId(); }
    public String getClientId() { return clientId; }
    public String getBookReference() { return bookReference; }
    public String getBookTitle() { return bookTitle; }
    public String getBookAuthor() { return bookAuthor; }
    public String getBookCategory() { return bookCategory; }
    public ReadingActivityType getActionType() { return actionType; }
    public int getPagesRead() { return pagesRead; }
    public int getMinutesRead() { return minutesRead; }
    public String getNote() { return note; }
    public LocalDate getOccurredOn() { return occurredOn; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
