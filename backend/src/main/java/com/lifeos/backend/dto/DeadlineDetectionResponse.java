package com.lifeos.backend.dto;

import java.util.List;

public class DeadlineDetectionResponse {

    private List<DetectedDeadline> deadlines;

    public DeadlineDetectionResponse() {
    }

    public DeadlineDetectionResponse(
            List<DetectedDeadline> deadlines) {

        this.deadlines = deadlines;
    }

    public List<DetectedDeadline> getDeadlines() {
        return deadlines;
    }

    public void setDeadlines(
            List<DetectedDeadline> deadlines) {

        this.deadlines = deadlines;
    }
}