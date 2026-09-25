package com.lifeos.backend.controller;

import com.lifeos.backend.dto.DeadlineDetectionResponse;
import com.lifeos.backend.service.SmartDeadlineService;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/ai/deadlines")
public class SmartDeadlineController {

    private final SmartDeadlineService smartDeadlineService;

    public SmartDeadlineController(
            SmartDeadlineService smartDeadlineService) {

        this.smartDeadlineService = smartDeadlineService;
    }

    /*
     * TEXT-ONLY TEST ENDPOINT
     */
    @PostMapping(
            value = "/extract-text",
            consumes = MediaType.TEXT_PLAIN_VALUE
    )
    public ResponseEntity<DeadlineDetectionResponse> extractText(
            @RequestBody String text
    ) throws Exception {

        DeadlineDetectionResponse response =
                smartDeadlineService.extractDeadlines(
                        null,
                        text
                );

        return ResponseEntity.ok(response);
    }

    /*
     * MAIN SMART DEADLINE ENDPOINT
     *
     * Accepts:
     * - PDF
     * - PNG
     * - JPG/JPEG
     * - WEBP
     * - optional pasted text
     */
    @PostMapping(
            value = "/extract",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<DeadlineDetectionResponse> extractDeadlines(

            @RequestPart(
                    value = "file",
                    required = false
            )
            MultipartFile file,

            @RequestParam(
                    value = "text",
                    required = false
            )
            String text

    ) throws Exception {

        DeadlineDetectionResponse response =
                smartDeadlineService.extractDeadlines(
                        file,
                        text
                );

        return ResponseEntity.ok(response);
    }
}