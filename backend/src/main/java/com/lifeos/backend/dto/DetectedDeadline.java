package com.lifeos.backend.dto;

public class DetectedDeadline {

    private String title;
    private String date;
    private String time;
    private String type;
    private String priority;
    private double confidence;
    private String evidence;

    public DetectedDeadline() {
    }

    public DetectedDeadline(
            String title,
            String date,
            String time,
            String type,
            String priority,
            double confidence,
            String evidence) {

        this.title = title;
        this.date = date;
        this.time = time;
        this.type = type;
        this.priority = priority;
        this.confidence = confidence;
        this.evidence = evidence;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getEvidence() {
        return evidence;
    }

    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }
}