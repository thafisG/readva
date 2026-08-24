package com.readva.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.readva.api.account.domain.ReaderAccount;
import com.readva.api.account.infrastructure.ReaderAccountRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthenticationIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ReaderAccountRepository readerAccountRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void registersWithAHashAndKeepsTheAuthenticatedSession() throws Exception {
        CsrfCredentials csrf = obtainCsrf();
        MvcResult registration = mockMvc.perform(withCsrf(post("/api/auth/register"), csrf)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Leitora Segura",
                                  "email": "segura@example.com",
                                  "password": "Leitura@123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("segura@example.com"))
                .andReturn();

        HttpSession session = registration.getRequest().getSession(false);
        assertThat(session).isInstanceOf(MockHttpSession.class);
        ReaderAccount reader = readerAccountRepository
                .findByNormalizedEmail("segura@example.com")
                .orElseThrow();
        assertThat(reader.getPasswordHash()).isNotEqualTo("Leitura@123");
        assertThat(passwordEncoder.matches("Leitura@123", reader.getPasswordHash())).isTrue();

        mockMvc.perform(get("/api/auth/session").session((MockHttpSession) session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Leitora Segura"));
    }

    @Test
    void rejectsInvalidCredentialsWithoutRevealingTheAccount() throws Exception {
        CsrfCredentials csrf = obtainCsrf();
        mockMvc.perform(withCsrf(post("/api/auth/login"), csrf)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "unknown@example.com",
                                  "password": "senha-incorreta"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("E-mail ou senha inválidos."));
    }

    @Test
    void protectsReaderEndpointsAndRequiresCsrfForRegistration() throws Exception {
        mockMvc.perform(get("/api/readers/00000000-0000-0000-0000-000000000001"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Sem CSRF",
                                  "email": "csrf@example.com",
                                  "password": "Leitura@123"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    private CsrfCredentials obtainCsrf() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return new CsrfCredentials(cookie.getValue(), cookie);
    }

    private MockHttpServletRequestBuilder withCsrf(
            MockHttpServletRequestBuilder request, CsrfCredentials csrf) {
        return request.header("X-XSRF-TOKEN", csrf.token()).cookie(csrf.cookie());
    }

    private record CsrfCredentials(String token, Cookie cookie) {}
}
