package com.example.dto;

public record SubmissionRequest(Long questionId, String code, String language, String type, String customInput) {
}
