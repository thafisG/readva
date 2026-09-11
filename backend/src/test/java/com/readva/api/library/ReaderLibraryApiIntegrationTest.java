package com.readva.api.library;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
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
class ReaderLibraryApiIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ReaderAccountService readerAccountService;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void persistsBooksForTheAuthenticatedOwnerAndRejectsAnotherReader() throws Exception {
        ReaderAccount owner = createReader("Owner", "owner-library@example.com");
        ReaderAccount other = createReader("Other", "other-library@example.com");
        String endpoint = "/api/readers/" + owner.getId() + "/books/local-book-1";

        mockMvc.perform(put(endpoint)
                        .with(user(owner.getNormalizedEmail()).roles("READER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "local-book-1",
                                  "title": "Torto Arado",
                                  "author": "Itamar Vieira Junior",
                                  "coverUrl": "https://example.com/torto-arado.jpg",
                                  "totalPages": 264,
                                  "currentPage": 40,
                                  "category": "Literatura",
                                  "status": "reading",
                                  "createdAt": "2026-08-01T12:00:00Z",
                                  "startedOn": "2026-08-01"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("local-book-1"))
                .andExpect(jsonPath("$.currentPage").value(40));

        mockMvc.perform(get("/api/readers/" + owner.getId() + "/books")
                        .with(user(owner.getNormalizedEmail()).roles("READER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Torto Arado"));

        mockMvc.perform(get("/api/readers/" + owner.getId() + "/books")
                        .with(user(other.getNormalizedEmail()).roles("READER")))
                .andExpect(status().isForbidden());
    }

    private ReaderAccount createReader(String name, String email) {
        return readerAccountService.create(name, email, passwordEncoder.encode("Leitura@123"));
    }
}
