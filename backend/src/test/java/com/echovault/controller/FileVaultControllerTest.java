package com.echovault.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FileVaultControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/health returns UP status and threshold configuration")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.thresholdRequired").value(3))
                .andExpect(jsonPath("$.totalShares").value(5))
                .andExpect(jsonPath("$.activeDatabase").value("H2 (File-based local persistent)"));
    }

    @Test
    @DisplayName("File upload, list, simulate recovery, and deletion REST workflow")
    void testFullRestWorkflow() throws Exception {
        // 1. Upload
        MockMultipartFile file = new MockMultipartFile(
                "file", "contract.pdf", "application/pdf", "Dummy PDF content for EchoVault".getBytes(StandardCharsets.UTF_8)
        );

        String uploadResponse = mockMvc.perform(multipart("/api/files").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.fileName").value("contract.pdf"))
                .andExpect(jsonPath("$.totalSharesGenerated").value(5))
                .andExpect(jsonPath("$.recoveryThreshold").value(3))
                .andReturn().getResponse().getContentAsString();

        Map<?, ?> uploadMap = objectMapper.readValue(uploadResponse, Map.class);
        String fileId = (String) uploadMap.get("id");

        // 2. List files
        mockMvc.perform(get("/api/files"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        // 3. Status
        mockMvc.perform(get("/api/files/" + fileId + "/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fileId))
                .andExpect(jsonPath("$.shares", hasSize(5)));

        // 4. Recovery simulation with 3 shares (success)
        String requestBodySuccess = objectMapper.writeValueAsString(Map.of(
                "activeShareIndices", List.of(1, 2, 4),
                "simulateOnly", true
        ));

        mockMvc.perform(post("/api/files/" + fileId + "/recover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBodySuccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.thresholdMet").value(true))
                .andExpect(jsonPath("$.authenticationVerified").value(true));

        // 5. Recovery simulation with 2 shares (threshold failure)
        String requestBodyFail = objectMapper.writeValueAsString(Map.of(
                "activeShareIndices", List.of(1, 2),
                "simulateOnly", true
        ));

        mockMvc.perform(post("/api/files/" + fileId + "/recover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBodyFail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.thresholdMet").value(false));

        // 6. Actual file recovery download with 3 shares
        mockMvc.perform(post("/api/files/" + fileId + "/recover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("activeShareIndices", List.of(1, 3, 5)))))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("contract.pdf")))
                .andExpect(content().bytes("Dummy PDF content for EchoVault".getBytes(StandardCharsets.UTF_8)));

        // 7. Delete file
        mockMvc.perform(delete("/api/files/" + fileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 8. Confirm deleted (404)
        mockMvc.perform(get("/api/files/" + fileId + "/status"))
                .andExpect(status().isNotFound());
    }
}
