package com.readva.api.library.domain;

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
import java.util.UUID;

@Entity
@Table(name = "reader_book")
public class ReaderBook {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reader_id", nullable = false)
    private ReaderAccount reader;

    @Column(name = "client_id", nullable = false, length = 160)
    private String clientId;

    @Column(nullable = false, length = 240)
    private String title;

    @Column(nullable = false, length = 160)
    private String author;

    @Column(name = "cover_url", nullable = false, columnDefinition = "TEXT")
    private String coverUrl;

    @Column(name = "total_pages", nullable = false)
    private int totalPages;

    @Column(name = "current_page", nullable = false)
    private int currentPage;

    @Column(nullable = false, length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReaderBookStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected ReaderBook() {}

    public ReaderBook(
            ReaderAccount reader,
            String clientId,
            String title,
            String author,
            String coverUrl,
            int totalPages,
            int currentPage,
            String category,
            ReaderBookStatus status,
            Instant createdAt,
            Instant completedAt) {
        this.id = UUID.randomUUID();
        this.reader = reader;
        this.clientId = clientId;
        this.createdAt = createdAt == null ? Instant.now() : createdAt;
        replace(title, author, coverUrl, totalPages, currentPage, category, status, completedAt);
    }

    public void replace(
            String title,
            String author,
            String coverUrl,
            int totalPages,
            int currentPage,
            String category,
            ReaderBookStatus status,
            Instant completedAt) {
        this.title = title;
        this.author = author;
        this.coverUrl = coverUrl;
        this.totalPages = totalPages;
        this.currentPage = status == ReaderBookStatus.COMPLETED ? totalPages : currentPage;
        this.category = category;
        this.status = status;
        this.completedAt = status == ReaderBookStatus.COMPLETED
                ? (completedAt == null ? Instant.now() : completedAt)
                : null;
        this.updatedAt = Instant.now();
    }

    public void adjustProgress(int pagesDelta) {
        if (pagesDelta == 0 || status == ReaderBookStatus.COMPLETED) return;
        currentPage = Math.max(0, Math.min(totalPages, currentPage + pagesDelta));
        updatedAt = Instant.now();
    }
    public UUID getId() { return id; }
    public UUID getReaderId() { return reader.getId(); }
    public String getClientId() { return clientId; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getCoverUrl() { return coverUrl; }
    public int getTotalPages() { return totalPages; }
    public int getCurrentPage() { return currentPage; }
    public String getCategory() { return category; }
    public ReaderBookStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getCompletedAt() { return completedAt; }
}
