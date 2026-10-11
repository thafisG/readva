package com.readva.api.profile.domain;

import com.readva.api.account.domain.ReaderAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reader_profile")
public class ReaderProfile {
    @Id
    private UUID readerId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reader_id")
    private ReaderAccount reader;

    @Column(length = 280)
    private String bio;

    @Column(name = "avatar_skin_tone", length = 20)
    private String avatarSkinTone;

    @Column(name = "avatar_hair_style", length = 20)
    private String avatarHairStyle;

    @Column(name = "avatar_hair_color", length = 20)
    private String avatarHairColor;

    @Column(name = "avatar_shirt_color", length = 20)
    private String avatarShirtColor;

    @Column(name = "avatar_accessory", length = 20)
    private String avatarAccessory;

    @Column(name = "local_migration_completed", nullable = false)
    private boolean localMigrationCompleted;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ReaderProfile() {}

    public ReaderProfile(ReaderAccount reader) {
        Instant now = Instant.now();
        this.reader = reader;
        this.localMigrationCompleted = false;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void update(String bio, AvatarConfiguration avatar) {
        this.bio = normalizeBio(bio);
        applyAvatar(avatar);
        this.updatedAt = Instant.now();
    }

    public void importLegacy(String bio, AvatarConfiguration avatar) {
        if (localMigrationCompleted) return;
        if (bio != null && !bio.isBlank()) this.bio = normalizeBio(bio);
        if (avatar != null) applyAvatar(avatar);
        this.localMigrationCompleted = true;
        this.updatedAt = Instant.now();
    }

    public AvatarConfiguration getAvatar() {
        if (avatarSkinTone == null
                || avatarHairStyle == null
                || avatarHairColor == null
                || avatarShirtColor == null
                || avatarAccessory == null) {
            return null;
        }
        return new AvatarConfiguration(
                avatarSkinTone,
                avatarHairStyle,
                avatarHairColor,
                avatarShirtColor,
                avatarAccessory);
    }

    private void applyAvatar(AvatarConfiguration avatar) {
        this.avatarSkinTone = avatar == null ? null : avatar.skinTone();
        this.avatarHairStyle = avatar == null ? null : avatar.hairStyle();
        this.avatarHairColor = avatar == null ? null : avatar.hairColor();
        this.avatarShirtColor = avatar == null ? null : avatar.shirtColor();
        this.avatarAccessory = avatar == null ? null : avatar.accessory();
    }

    private String normalizeBio(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim().replaceAll("\\s+", " ");
    }

    public String getBio() {
        return bio;
    }

    public boolean isLocalMigrationCompleted() {
        return localMigrationCompleted;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
