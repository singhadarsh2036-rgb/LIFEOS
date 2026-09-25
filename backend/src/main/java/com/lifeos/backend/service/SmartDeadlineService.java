package com.lifeos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.backend.dto.DeadlineDetectionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SmartDeadlineService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash-lite}")
    private String model;

    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public SmartDeadlineService() {

        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder().build();
    }

    public DeadlineDetectionResponse extractDeadlines(
            MultipartFile file,
            String pastedText) throws IOException {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Gemini API key is not configured");
        }

        if ((file == null || file.isEmpty())
                && (pastedText == null || pastedText.isBlank())) {

            throw new IllegalArgumentException(
                    "Please upload a file or provide text");
        }

        List<Map<String, Object>> parts = new ArrayList<>();

        String prompt = buildPrompt(pastedText);

        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", prompt);
        parts.add(textPart);

        if (file != null && !file.isEmpty()) {

            String mimeType = file.getContentType();

            if (mimeType == null || mimeType.isBlank()) {
                throw new IllegalArgumentException(
                        "Unable to determine file type");
            }

            if (!isSupportedFileType(mimeType)) {
                throw new IllegalArgumentException(
                        "Unsupported file type. Please upload a PDF or image.");
            }

            Map<String, Object> inlineData =
                    new LinkedHashMap<>();

            inlineData.put(
                    "mimeType",
                    mimeType
            );

            inlineData.put(
                    "data",
                    java.util.Base64.getEncoder()
                            .encodeToString(file.getBytes())
            );

            Map<String, Object> filePart =
                    new LinkedHashMap<>();

            filePart.put(
                    "inlineData",
                    inlineData
            );

            parts.add(filePart);
        }

        Map<String, Object> content =
                new LinkedHashMap<>();

        content.put("parts", parts);

        List<Map<String, Object>> contents =
                new ArrayList<>();

        contents.add(content);

        Map<String, Object> deadlineItemSchema =
                new LinkedHashMap<>();

        deadlineItemSchema.put(
                "type",
                "object"
        );

        Map<String, Object> properties =
                new LinkedHashMap<>();

        properties.put(
                "title",
                Map.of(
                        "type", "string",
                        "description",
                        "Clear name of the task, deadline or event"
                )
        );

        properties.put(
                "date",
                Map.of(
                        "type", "string",
                        "description",
                        "Deadline date in YYYY-MM-DD format. Use empty string if no date exists."
                )
        );

        properties.put(
                "time",
                Map.of(
                        "type", "string",
                        "description",
                        "Deadline time in HH:mm 24-hour format. Use empty string if no time exists."
                )
        );

        properties.put(
                "type",
                Map.of(
                        "type", "string",
                        "description",
                        "Type such as ASSIGNMENT, EXAM, PROJECT, PAYMENT, APPOINTMENT, EVENT, APPLICATION, OTHER"
                )
        );

        properties.put(
                "priority",
                Map.of(
                        "type", "string",
                        "description",
                        "LOW, MEDIUM or HIGH"
                )
        );

        properties.put(
                "confidence",
                Map.of(
                        "type", "number",
                        "description",
                        "Confidence between 0 and 1"
                )
        );

        properties.put(
                "evidence",
                Map.of(
                        "type", "string",
                        "description",
                        "Short exact or near-exact evidence from the document that supports the detected deadline"
                )
        );

        deadlineItemSchema.put(
                "properties",
                properties
        );

        deadlineItemSchema.put(
                "required",
                List.of(
                        "title",
                        "date",
                        "time",
                        "type",
                        "priority",
                        "confidence",
                        "evidence"
                )
        );

        Map<String, Object> responseSchema =
                new LinkedHashMap<>();

        responseSchema.put(
                "type",
                "object"
        );

        responseSchema.put(
                "properties",
                Map.of(
                        "deadlines",
                        Map.of(
                                "type", "array",
                                "items", deadlineItemSchema
                        )
                )
        );

        responseSchema.put(
                "required",
                List.of("deadlines")
        );

        Map<String, Object> generationConfig =
                new LinkedHashMap<>();

        generationConfig.put(
                "responseMimeType",
                "application/json"
        );

        generationConfig.put(
                "responseSchema",
                responseSchema
        );

        Map<String, Object> requestBody =
                new LinkedHashMap<>();

        requestBody.put(
                "contents",
                contents
        );

        requestBody.put(
                "generationConfig",
                generationConfig
        );

        String url =
                "https://generativelanguage.googleapis.com/v1beta/models/"
                        + model
                        + ":generateContent";

        String responseBody =
                restClient.post()
                        .uri(url)
                        .header(
                                "x-goog-api-key",
                                apiKey
                        )
                        .contentType(
                                MediaType.APPLICATION_JSON
                        )
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);

        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalStateException(
                    "Gemini returned an empty response");
        }

        return parseGeminiResponse(responseBody);
    }

    private String buildPrompt(String pastedText) {

        String today =
                LocalDate.now(
                        ZoneId.of("Asia/Kolkata")
                ).toString();

        StringBuilder prompt =
                new StringBuilder();

        prompt.append("""
                You are LIFEOS Smart Deadline Detection AI.

                Your job is to carefully analyze the supplied document,
                image, and/or text and find every genuine deadline,
                due date, submission date, exam date, appointment date,
                payment deadline, application deadline, event date,
                or other actionable date that a user may need to remember.

                Current date is:
                """);

        prompt.append(today);

        prompt.append("""

                IMPORTANT RULES:

                1. Do not invent deadlines.
                2. Only extract dates that are actually supported by the
                   supplied content.
                3. If a date is present but the year is missing, infer the
                   nearest reasonable occurrence based on the current date.
                4. If the exact time is not present, return an empty string
                   for time.
                5. Convert dates to YYYY-MM-DD.
                6. Convert times to 24-hour HH:mm format.
                7. Preserve the meaning of the original deadline.
                8. If multiple deadlines exist, return all of them.
                9. Ignore ordinary dates that are not actionable deadlines
                   unless they clearly represent an exam, event, appointment,
                   submission, payment, application or similar important date.
                10. Confidence must be between 0 and 1.
                11. Evidence should briefly explain which text/date caused
                    you to detect the deadline.
                12. If no genuine deadline is found, return an empty
                    deadlines array.

                Return ONLY the requested structured JSON.
                """);

        if (pastedText != null && !pastedText.isBlank()) {

            prompt.append("""

                    Additional text supplied by the user:

                    """);

            prompt.append(pastedText);
        }

        return prompt.toString();
    }

    private boolean isSupportedFileType(
            String mimeType) {

        return mimeType.equalsIgnoreCase(
                "application/pdf")
                || mimeType.equalsIgnoreCase(
                "image/png")
                || mimeType.equalsIgnoreCase(
                "image/jpeg")
                || mimeType.equalsIgnoreCase(
                "image/jpg")
                || mimeType.equalsIgnoreCase(
                "image/webp");
    }

    private DeadlineDetectionResponse parseGeminiResponse(
            String responseBody) throws IOException {

        JsonNode root =
                objectMapper.readTree(responseBody);

        JsonNode candidates =
                root.path("candidates");

        if (!candidates.isArray()
                || candidates.isEmpty()) {

            throw new IllegalStateException(
                    "Gemini returned no candidates");
        }

        JsonNode parts =
                candidates
                        .get(0)
                        .path("content")
                        .path("parts");

        if (!parts.isArray()
                || parts.isEmpty()) {

            throw new IllegalStateException(
                    "Gemini returned no content");
        }

        String jsonText =
                parts
                        .get(0)
                        .path("text")
                        .asText();

        if (jsonText == null
                || jsonText.isBlank()) {

            throw new IllegalStateException(
                    "Gemini returned empty structured output");
        }

        return objectMapper.readValue(
                jsonText,
                DeadlineDetectionResponse.class
        );
    }
}