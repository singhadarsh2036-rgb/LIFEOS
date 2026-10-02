package com.lifeos.backend.controller;

import com.lifeos.backend.service.AiSuggestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiSuggestionController {

    private final AiSuggestionService aiSuggestionService;

    public AiSuggestionController(AiSuggestionService aiSuggestionService) {
        this.aiSuggestionService = aiSuggestionService;
    }

    @PostMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(
            @RequestBody AiSuggestionRequest request,
            @RequestAttribute("userEmail") String email) {

        try {
            List<AiSuggestionService.AiSuggestion> suggestions =
                    aiSuggestionService.generateSuggestions(
                            request.tasks(),
                            request.reminders()
                    );

            return ResponseEntity.ok(Map.of("suggestions", suggestions));

        } catch (Exception error) {
            return ResponseEntity.internalServerError().body(
                    Map.of("message", "Could not generate AI suggestions")
            );
        }
    }

    public record AiSuggestionRequest(
            List<Map<String, Object>> tasks,
            List<Map<String, Object>> reminders
    ) {}
}
