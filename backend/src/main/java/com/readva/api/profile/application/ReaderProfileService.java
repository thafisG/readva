package com.readva.api.profile.application;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.profile.domain.ReaderProfile;
import com.readva.api.profile.domain.ReaderProfileState;
import com.readva.api.profile.infrastructure.ReaderProfileRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReaderProfileService {
    private final ReaderAccountService readerAccountService;
    private final ReaderProfileRepository repository;

    public ReaderProfileService(
            ReaderAccountService readerAccountService, ReaderProfileRepository repository) {
        this.readerAccountService = readerAccountService;
        this.repository = repository;
    }

    @Transactional
    public ReaderProfileState get(UUID readerId) {
        ReaderAccount reader = readerAccountService.findById(readerId);
        return toState(reader, findOrCreate(reader));
    }

    @Transactional
    public ReaderProfileState save(UUID readerId, SaveReaderProfileCommand command) {
        ReaderAccount reader = readerAccountService.findById(readerId);
        reader.updateDisplayName(command.displayName());
        ReaderProfile profile = findOrCreate(reader);
        profile.update(command.bio(), command.avatar());
        return toState(reader, profile);
    }

    @Transactional
    public ReaderProfileState importLegacy(UUID readerId, ImportReaderProfileCommand command) {
        ReaderAccount reader = readerAccountService.findById(readerId);
        ReaderProfile profile = findOrCreate(reader);
        profile.importLegacy(command.bio(), command.avatar());
        return toState(reader, profile);
    }

    private ReaderProfile findOrCreate(ReaderAccount reader) {
        return repository
                .findById(reader.getId())
                .orElseGet(() -> repository.save(new ReaderProfile(reader)));
    }

    private ReaderProfileState toState(ReaderAccount reader, ReaderProfile profile) {
        return new ReaderProfileState(
                reader.getId(),
                reader.getDisplayName(),
                reader.getEmail(),
                profile.getBio(),
                profile.getAvatar(),
                profile.isLocalMigrationCompleted(),
                profile.getUpdatedAt());
    }
}
