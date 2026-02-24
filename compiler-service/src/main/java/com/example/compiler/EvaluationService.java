package com.example.compiler;

import com.example.DAO.SubmissionRepository;
import com.example.bean.Submission;
import com.example.bean.Question;
import com.example.dto.SubmissionTask;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Service
public class EvaluationService {

    @Value("${compiler.testcases.dir}")
    private String testCasesDir;

    private final SubmissionRepository submissionRepository;
    private final DockerService dockerService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EvaluationService(SubmissionRepository submissionRepository,
            DockerService dockerService,
            org.springframework.data.redis.core.StringRedisTemplate redisTemplate) {
        this.submissionRepository = submissionRepository;
        this.dockerService = dockerService;
        this.redisTemplate = redisTemplate;
    }

    public void evaluate(SubmissionTask task) {
        System.out.println("Starting evaluation for submission: " + task.submissionId());
        Submission submission = submissionRepository.findById(task.submissionId()).orElseThrow();
        submission.setStatus("PROCESSING");
        submissionRepository.save(submission);
        finalizeEvaluation(submission); // Broadcast PROCESSING status to client

        System.out.println("Status updated to PROCESSING for submission: " + task.submissionId());

        if ("RUN_CUSTOM".equals(task.jobType())) {
            evaluateCustom(task, submission);
        } else if ("RUN_VISIBLE".equals(task.jobType())) {
            evaluateVisible(task, submission);
        } else {
            evaluateSubmit(task, submission);
        }
    }

    private void evaluateCustom(SubmissionTask task, Submission submission) {
        try {
            String output = dockerService.runCode(task.submissionId().toString(), task.code(),
                    task.questionId().toString(), task.customInput(), task.timeLimit());
            submission.setStatus("FINISHED");
            submission.setResultMetadata(String.format("{\"output\": %s}", objectMapper.writeValueAsString(output)));
        } catch (Exception e) {
            submission.setStatus("ERROR");
            try {
                submission.setResultMetadata(
                        String.format("{\"error\": %s}", objectMapper.writeValueAsString(e.getMessage())));
            } catch (Exception ex) {
                submission.setResultMetadata("{\"error\": \"JSON conversion error\"}");
            }
        }
        finalizeEvaluation(submission);
    }

    private void evaluateVisible(SubmissionTask task, Submission submission) {
        Question question = submission.getQuestion();
        String visibleTestCasesJson = question.getVisibleTestCasesJson();
        StringBuilder metadata = new StringBuilder("[");
        boolean allPassed = true;

        try {
            if (visibleTestCasesJson != null && !visibleTestCasesJson.isEmpty()) {
                JsonNode testCases = objectMapper.readTree(visibleTestCasesJson);
                if (testCases.isArray()) {
                    for (int i = 0; i < testCases.size(); i++) {
                        JsonNode tc = testCases.get(i);
                        String input = tc.get("input").asText();
                        String expected = tc.get("output").asText();

                        String output = dockerService.runCode(task.submissionId().toString(), task.code(),
                                task.questionId().toString(), input, task.timeLimit());

                        boolean passed = output != null && output.trim().equals(expected.trim());
                        if (!passed)
                            allPassed = false;

                        if (i > 0)
                            metadata.append(",");
                        metadata.append(String.format(
                                "{\"testCase\": %d, \"passed\": %b, \"input\": %s, \"expected\": %s, \"actual\": %s}",
                                i + 1, passed,
                                objectMapper.writeValueAsString(input),
                                objectMapper.writeValueAsString(expected),
                                objectMapper.writeValueAsString(output)));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            allPassed = false;
        }

        metadata.append("]");
        submission.setStatus(allPassed ? "FINISHED" : "FAILED");
        submission.setResultMetadata(metadata.toString());
        finalizeEvaluation(submission);
    }

    private void evaluateSubmit(SubmissionTask task, Submission submission) {
        Question question = submission.getQuestion();
        String visibleTestCasesJson = question.getVisibleTestCasesJson();
        boolean allPassed = true;
        int testCaseCounter = 0;
        int totalTestCases = 0;

        // Count total test cases first
        try {
            if (visibleTestCasesJson != null && !visibleTestCasesJson.isEmpty()) {
                JsonNode testCases = objectMapper.readTree(visibleTestCasesJson);
                if (testCases.isArray()) {
                    totalTestCases += testCases.size();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        String hiddenDir = testCasesDir + "/" + task.questionId() + "/hidden";
        File dir = new File(hiddenDir);
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((d, name) -> name.startsWith("in_") && name.endsWith(".txt"));
            if (files != null) {
                totalTestCases += files.length;
            }
        }

        StringBuilder resultsJson = new StringBuilder("[");

        // 1. Visible Test Cases
        try {
            if (visibleTestCasesJson != null && !visibleTestCasesJson.isEmpty()) {
                JsonNode testCases = objectMapper.readTree(visibleTestCasesJson);
                if (testCases.isArray()) {
                    for (int i = 0; i < testCases.size(); i++) {
                        testCaseCounter++;
                        JsonNode tc = testCases.get(i);
                        String input = tc.get("input").asText();
                        String expected = tc.get("output").asText();

                        String output = dockerService.runCode(task.submissionId().toString(), task.code(),
                                task.questionId().toString(), input, task.timeLimit());

                        boolean passed = output != null && output.trim().equals(expected.trim());
                        if (!passed)
                            allPassed = false;

                        if (testCaseCounter > 1)
                            resultsJson.append(",");
                        resultsJson.append(String.format(
                                "{\"testCase\": %d, \"passed\": %b, \"type\": \"visible\", \"expected\": %s, \"actual\": %s}",
                                testCaseCounter, passed,
                                objectMapper.writeValueAsString(expected),
                                objectMapper.writeValueAsString(output)));

                        if (!passed)
                            break;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            allPassed = false;
        }

        // 2. Hidden Test Cases (from filesystem)
        if (allPassed) {
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles((d, name) -> name.startsWith("in_") && name.endsWith(".txt"));
                if (files != null) {
                    Arrays.sort(files, (a, b) -> a.getName().compareTo(b.getName()));
                    for (File inFile : files) {
                        try {
                            String input = Files.readString(inFile.toPath());
                            String outFileName = inFile.getName().replace("in_", "out_");
                            String expected = Files.readString(new File(hiddenDir, outFileName).toPath());

                            String output = dockerService.runCode(task.submissionId().toString(), task.code(),
                                    task.questionId().toString(), input, task.timeLimit());

                            boolean passed = output != null && output.trim().equals(expected.trim());
                            if (!passed)
                                allPassed = false;

                            testCaseCounter++; // Only increment if we actually ran it or to keep index consistent
                            if (testCaseCounter > 1)
                                resultsJson.append(",");
                            resultsJson.append(String.format("{\"testCase\": %d, \"passed\": %b, \"type\": \"hidden\"}",
                                    testCaseCounter, passed));

                            if (!passed)
                                break;
                        } catch (Exception e) {
                            e.printStackTrace();
                            allPassed = false;
                            break;
                        }
                    }
                }
            }
        }

        resultsJson.append("]");
        submission.setStatus(allPassed ? "ACCEPTED" : "WRONG_ANSWER");

        // Wrap results in a container object with total count
        String finalMetadata = String.format("{\"total\": %d, \"results\": %s}", totalTestCases,
                resultsJson.toString());
        submission.setResultMetadata(finalMetadata);
        finalizeEvaluation(submission);
    }

    private void finalizeEvaluation(Submission submission) {
        submissionRepository.save(submission);
        try {
            Map<String, Object> update = new HashMap<>();
            update.put("id", submission.getId());
            update.put("questionId", submission.getQuestion().getId());
            update.put("status", submission.getStatus());
            update.put("resultMetadata", submission.getResultMetadata());
            update.put("type", submission.getType());
            update.put("submittedAt", submission.getCreatedAt().toString());

            String updateMessage = objectMapper.writeValueAsString(update);
            redisTemplate.convertAndSend("submission_updates", updateMessage);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
