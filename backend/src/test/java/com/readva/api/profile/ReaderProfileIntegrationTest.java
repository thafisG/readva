package com.readva.api.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.profile.application.ImportReaderProfileCommand;
import com.readva.api.profile.application.ReaderProfileService;
import com.readva.api.profile.domain.AvatarConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReaderProfileIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ReaderAccountService readerAccountService;
    @Autowired private ReaderProfileService readerProfileService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void savesAValidatedProfileForTheAuthenticatedOwner() throws Exception {
        ReaderAccount owner = createReader("Perfil", "profile-owner@example.com");
        String endpoint = "/api/readers/" + owner.getId() + "/profile";

        mockMvc.perform(put(endpoint)
                        .with(user(owner.getNormalizedEmail()).roles("READER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Leitora do Café",
                                  "bio": "  Ficção, café e finais de semana.  ",
                                  "avatar": {
                                    "skinTone": "tan",
                                    "hairStyle": "bun",
                                    "hairColor": "black",
                                    "shirtColor": "blue",
                                    "accessory": "glasses"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Leitora do Café"))
                .andExpect(jsonPath("$.bio").value("Ficção, café e finais de semana."))
                .andExpect(jsonPath("$.avatar.hairStyle").value("bun"));

        mockMvc.perform(get(endpoint).with(user(owner.getNormalizedEmail()).roles("READER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar.accessory").value("glasses"));

        assertThat(readerAccountService.findById(owner.getId()).getDisplayName())
                .isEqualTo("Leitora do Café");
    }

    @Test
    void importsTheLegacyAvatarOnlyOnceAcrossDevices() {
        ReaderAccount reader = createReader("Migração", "profile-migration@example.com");
        AvatarConfiguration firstAvatar =
                new AvatarConfiguration("warm", "curly", "espresso", "coffee", "none");
        AvatarConfiguration secondAvatar =
                new AvatarConfiguration("deep", "long", "black", "rose", "earrings");

        readerProfileService.importLegacy(
                reader.getId(), new ImportReaderProfileCommand(null, firstAvatar));
        var secondDevice = readerProfileService.importLegacy(
                reader.getId(), new ImportReaderProfileCommand(null, secondAvatar));

        assertThat(secondDevice.localMigrationCompleted()).isTrue();
        assertThat(secondDevice.avatar()).isEqualTo(firstAvatar);
    }

    @Test
    void rejectsAnotherReaderAndAnUnsupportedAvatarOption() throws Exception {
        ReaderAccount owner = createReader("Owner", "profile-owner-two@example.com");
        ReaderAccount other = createReader("Other", "profile-other@example.com");
        String endpoint = "/api/readers/" + owner.getId() + "/profile";

        mockMvc.perform(get(endpoint).with(user(other.getNormalizedEmail()).roles("READER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(put(endpoint)
                        .with(user(owner.getNormalizedEmail()).roles("READER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Owner",
                                  "avatar": {
                                    "skinTone": "purple",
                                    "hairStyle": "short",
                                    "hairColor": "black",
                                    "shirtColor": "blue",
                                    "accessory": "none"
                                  }
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Revise os campos informados."));
    }

    private ReaderAccount createReader(String name, String email) {
        return readerAccountService.create(name, email, passwordEncoder.encode("Leitura@123"));
    }
}
