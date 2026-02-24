package com.example.controller;

import com.example.DAO.UserRepository;
import com.example.bean.Submission;
import com.example.bean.User;
import com.example.dto.SubmissionRequest;
import com.example.service.QuestionService;
import com.example.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;
    private final QuestionService questionService;
    private final UserRepository userRepository;

    public SubmissionController(SubmissionService submissionService, QuestionService questionService,
            UserRepository userRepository) {
        this.submissionService = submissionService;
        this.questionService = questionService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> submitCode(Authentication auth, @RequestBody SubmissionRequest req) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        var question = questionService.getQuestionById(req.questionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setQuestion(question);
        submission.setCode(req.code());
        submission.setLanguage(req.language());
        submission.setStatus("QUEUED");

        Submission saved = submissionService.saveSubmission(submission, req.type(), req.customInput());

        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Submission> getMySubmissions(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        return submissionService.getUserSubmissions(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Submission> getSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getSubmissionById(id));
    }
}
