package com.example.service;

import com.example.DAO.SubmissionRepository;
import com.example.bean.Submission;
import com.example.bean.User;
import com.example.dto.SubmissionTask;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String QUEUE_NAME = "submission_queue";

    public SubmissionService(SubmissionRepository submissionRepository,
            org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate) {
        this.submissionRepository = submissionRepository;
        this.redisTemplate = redisTemplate;
    }

    public Submission saveSubmission(Submission submission, String type, String customInput) {
        submission.setType(type);
        Submission saved = submissionRepository.save(submission);
        enqueueSubmission(saved, customInput);
        return saved;
    }

    private void enqueueSubmission(Submission submission, String customInput) {
        com.example.dto.SubmissionTask task = new com.example.dto.SubmissionTask(
                submission.getId(),
                submission.getQuestion().getId(),
                submission.getCode(),
                submission.getLanguage(),
                submission.getQuestion().getTimeLimit(),
                submission.getQuestion().getMemoryLimit(),
                submission.getType(),
                customInput);
        redisTemplate.opsForList().leftPush(QUEUE_NAME, task);
    }

    public List<Submission> getUserSubmissions(User user) {
        return submissionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Submission getSubmissionById(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
    }
}
