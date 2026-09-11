package com.readva.api.reading;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.readva.api.account.application.ReaderAccountService;
import com.readva.api.account.domain.ReaderAccount;
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
class ReadingActivityApiIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ReaderAccountService readerAccountService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void letsTheOwnerManageAnActivityAndRejectsAnotherReader() throws Exception {
        ReaderAccount owner = createReader("Owner", "owner-activity@example.com");
        ReaderAccount other = createReader("Other", "other-activity@example.com");
        String collection = "/api/readers/" + owner.getId() + "/activities";
        String endpoint = collection + "/activity-1";

        mockMvc.perform(put(endpoint)
                        .with(user(owner.getNormalizedEmail()).roles("READER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "activity-1",
                                  "bookReference": "book-1",
                                  "bookTitle": "Duna",
                                  "bookAuthor": "Frank Herbert",
                                  "bookCategory": "Ficção Científica",
                                  "actionType": "progress",
                                  "pagesRead": 20,
                                  "minutesRead": 15,
                                  "note": "Leitura da noite",
                                  "occurredOn": "2026-08-20",
                                  "createdAt": "2026-08-20T12:00:00Z",
                                  "updatedAt": "2026-08-20T12:00:00Z"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("activity-1"))
                .andExpect(jsonPath("$.bookAuthor").value("Frank Herbert"));

        mockMvc.perform(get(collection).with(user(owner.getNormalizedEmail()).roles("READER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pagesRead").value(20));

        mockMvc.perform(get(collection).with(user(other.getNormalizedEmail()).roles("READER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete(endpoint)
                        .with(user(owner.getNormalizedEmail()).roles("READER"))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(collection).with(user(owner.getNormalizedEmail()).roles("READER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    private ReaderAccount createReader(String name, String email) {
        return readerAccountService.create(name, email, passwordEncoder.encode("Leitura@123"));
    }
}
