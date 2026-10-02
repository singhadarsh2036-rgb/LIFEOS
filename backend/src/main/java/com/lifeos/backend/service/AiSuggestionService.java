package com.lifeos.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiSuggestionService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash-lite}")
    private String model;

    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public AiSuggestionService() {
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder().build();
    }

    public List<AiSuggestion> generateSuggestions(
            List<Map<String, Object>> tasks,
            List<Map<String, Object>> reminders) throws Exception {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        List<Map<String, Object>> safeTasks = sanitize(tasks, 20);
        List<Map<String, Object>> safeReminders = sanitize(reminders, 20);

        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();

        String prompt = """
                You are LIFEOS, a personal productivity assistant.

                Today is %s.

                Analyze the user's CURRENT tasks and reminders below and suggest the
                most useful next actions for today.

                RULES:
                1. Use only information present in the supplied data.
                2. Never invent a deadline, task or reminder.
                3. Prefer concrete, actionable suggestions.
                4. Prioritize urgent or overdue items first.
                5. If there are no urgent items, suggest a sensible productive next step.
                6. Do not suggest more than 3 items.
                7. Do not suggest deleting data or making irreversible changes.
                8. Keep titles short and natural.
                9. The action field must be suitable as a task title if the user chooses
                   to add it to LIFEOS.
                10. Return ONLY JSON matching the requested schema.

                CURRENT TASKS:
                %s

                CURRENT REMINDERS:
                %s
                """.formatted(
                today,
                objectMapper.writeValueAsString(safeTasks),
                objectMapper.writeValueAsString(safeReminders)
        );

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", parts);

        Map<String, Object> suggestionItemSchema = new LinkedHashMap<>();
        suggestionItemSchema.put("type", "object");
        suggestionItemSchema.put("properties", Map.of(
                "title", Map.of("type", "string"),
                "reason", Map.of("type", "string"),
                "action", Map.of("type", "string"),
                "priority", Map.of("type", "string")
        ));
        suggestionItemSchema.put("required", List.of(
                "title", "reason", "action", "priority"
        ));

        Map<String, Object> responseSchema = new LinkedHashMap<>();
        responseSchema.put("type", "object");
        responseSchema.put("properties", Map.of(
                "suggestions", Map.of(
                        "type", "array",
                        "items", suggestionItemSchema
                )
        ));
        responseSchema.put("required", List.of("suggestions"));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", responseSchema);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("contents", List.of(content));
        requestBody.put("generationConfig", generationConfig);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent";

        String responseBody = restClient.post()
                .uri(url)
                .header("x-goog-api-key", apiKey.trim())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        if (responseBody == null || responseBody.isBlank()) {
            throw new IllegalStateException("Gemini returned an empty response");
        }

        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode textNode = root.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Gemini returned no suggestion content");
        }

        JsonNode parsed = objectMapper.readTree(textNode.asText());
        JsonNode suggestionsNode = parsed.path("suggestions");

        if (!suggestionsNode.isArray()) {
            return List.of();
        }

        List<AiSuggestion> suggestions = objectMapper.convertValue(
                suggestionsNode,
                new TypeReference<List<AiSuggestion>>() {}
        );

        return suggestions.stream().limit(3).toList();
    }

    private List<Map<String, Object>> sanitize(
            List<Map<String, Object>> source,
            int maxItems) {

        List<Map<String, Object>> result = new ArrayList<>();

        if (source == null) {
            return result;
        }

        for (Map<String, Object> item : source) {
            if (item == null || result.size() >= maxItems) {
                break;
            }

            Map<String, Object> clean = new LinkedHashMap<>();
            copyIfPresent(item, clean, "id");
            copyIfPresent(item, clean, "title");
            copyIfPresent(item, clean, "completed");
            copyIfPresent(item, clean, "dueDate");
            copyIfPresent(item, clean, "dueTime");
            copyIfPresent(item, clean, "priority");
            copyIfPresent(item, clean, "reminderTime");

            result.add(clean);
        }

        return result;
    }

    private void copyIfPresent(
            Map<String, Object> source,
            Map<String, Object> target,
            String key) {
        if (source.containsKey(key)) {
            target.put(key, source.get(key));
        }
    }

    public record AiSuggestion(
            String title,
            String reason,
            String action,
            String priority
    ) {}
}
