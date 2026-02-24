package com.example.service;

import com.example.DAO.QuestionRepository;
import com.example.DAO.TestCaseRepository;
import com.example.bean.Question;
import com.example.bean.TestCase;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final TestCaseRepository testCaseRepository;

    public QuestionService(QuestionRepository questionRepository, TestCaseRepository testCaseRepository) {
        this.questionRepository = questionRepository;
        this.testCaseRepository = testCaseRepository;
    }

    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Optional<Question> getQuestionById(Long id) {
        return questionRepository.findById(id);
    }

    public List<TestCase> getVisibleTestCases(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        return testCaseRepository.findByQuestionAndVisibleTrue(question);
    }

    public Question saveQuestion(Question question) {
        return questionRepository.save(question);
    }
}
