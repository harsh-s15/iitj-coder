package com.example.dto;

import java.io.Serializable;

public record SubmissionTask(
                Long submissionId,
                Long questionId,
                String code,
                String language,
                Integer timeLimit,
                Integer memoryLimit,
                String jobType,
                String customInput) implements Serializable {
}
