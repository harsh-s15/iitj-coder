package com.example.compiler;

import com.example.dto.SubmissionTask;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class SubmissionConsumer {

    private final StringRedisTemplate redisTemplate;
    private final ExecutorService executorService;
    private final EvaluationService evaluationService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private static final String QUEUE_NAME = "submission_queue";
    private volatile boolean running = true;

    public SubmissionConsumer(StringRedisTemplate redisTemplate, EvaluationService evaluationService) {
        this.redisTemplate = redisTemplate;
        this.evaluationService = evaluationService;
        this.executorService = Executors.newFixedThreadPool(4);
    }

    @PostConstruct
    public void init() {
        Thread consumerThread = new Thread(() -> {
            while (running) {
                try {
                    String taskJson = redisTemplate.opsForList().rightPop(QUEUE_NAME, 1,
                            java.util.concurrent.TimeUnit.SECONDS);
                    if (taskJson != null && running) {
                        SubmissionTask task = objectMapper.readValue(taskJson, SubmissionTask.class);
                        executorService.submit(() -> processTask(task));
                    }
                } catch (Exception e) {
                    if (running) {
                        System.err.println("Error consuming from Redis: " + e.getMessage());
                    }
                }
            }
            System.out.println("SubmissionConsumer thread stopped.");
        });
        consumerThread.setName("SubmissionConsumerThread");
        consumerThread.start();
    }

    @PreDestroy
    public void shutdown() {
        System.out.println("Shutting down SubmissionConsumer...");
        running = false;
        executorService.shutdown();
    }

    private void processTask(SubmissionTask task) {
        System.out.println("Processing submission: " + task.submissionId());
        try {
            evaluationService.evaluate(task);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
