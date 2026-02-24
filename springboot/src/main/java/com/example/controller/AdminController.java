package com.example.controller;

import com.example.DAO.SubmissionRepository;
import com.example.DAO.UserRepository;
import com.example.DAO.QuestionRepository;
import com.example.DAO.TestCaseRepository;
import com.example.bean.Submission;
import com.example.bean.User;
import com.example.bean.Question;
import com.example.bean.TestCase;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;
    private final TestCaseRepository testCaseRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    public AdminController(UserRepository userRepository,
            SubmissionRepository submissionRepository,
            QuestionRepository questionRepository,
            TestCaseRepository testCaseRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.questionRepository = questionRepository;
        this.testCaseRepository = testCaseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/generate-credentials")
    public ResponseEntity<?> generateCredentials(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        String password = UUID.randomUUID().toString().substring(0, 8);

        User user = new User();
        user.setUsername(email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("STUDENT");

        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("username", email);
        response.put("password", password);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/questions")
    public ResponseEntity<Question> createQuestion(@RequestBody Map<String, Object> request) {
        Question question = new Question();
        question.setTitle((String) request.get("title"));
        question.setDescription((String) request.get("description"));
        question.setDifficulty((String) request.get("difficulty"));
        question.setStarterCode((String) request.get("starterCode"));

        // Safe parsing for Integer fields
        Object timeLimit = request.get("timeLimit");
        if (timeLimit instanceof Number) {
            question.setTimeLimit(((Number) timeLimit).intValue());
        } else if (timeLimit instanceof String) {
            question.setTimeLimit(Integer.parseInt((String) timeLimit));
        }

        Object memoryLimit = request.get("memoryLimit");
        if (memoryLimit instanceof Number) {
            question.setMemoryLimit(((Number) memoryLimit).intValue());
        } else if (memoryLimit instanceof String) {
            question.setMemoryLimit(Integer.parseInt((String) memoryLimit));
        }

        question.setVisibleTestCasesJson((String) request.get("visibleTestCasesJson"));

        Question saved = questionRepository.save(question);

        // Handle hidden test cases if provided
        if (request.containsKey("hiddenTestCases")) {
            List<Map<String, String>> hiddenCases = (List<Map<String, String>>) request.get("hiddenTestCases");
            saveHiddenTestCases(saved.getId(), hiddenCases);
        }

        return ResponseEntity.ok(saved);
    }

    private void saveHiddenTestCases(Long questionId, List<Map<String, String>> hiddenCases) {
        String url = "http://127.0.0.1:8081/internal/testcases/" + questionId;
        try {
            restTemplate.postForEntity(url, hiddenCases, Void.class);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PostMapping("/questions/{id}/test-cases")
    public ResponseEntity<TestCase> addTestCase(@PathVariable Long id, @RequestBody TestCase testCase) {
        var question = questionRepository.findById(id).orElseThrow();
        testCase.setQuestion(question);
        return ResponseEntity.ok(testCaseRepository.save(testCase));
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<Submission>> getAllSubmissions() {
        return ResponseEntity.ok(submissionRepository.findAll());
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getActiveSessions() {
        // Since listing all sessions from Spring Session can be complex depending on
        // the implementation
        // we'll provide a placeholder that indicates we can fetch this from the session
        // repository
        // in a production environment.
        return ResponseEntity.ok("Session listing requires FindByIndexNameSessionRepository bean configuration.");
    }
}
