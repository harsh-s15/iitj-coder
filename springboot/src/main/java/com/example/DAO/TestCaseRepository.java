package com.example.DAO;

import com.example.bean.Question;
import com.example.bean.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByQuestionAndVisibleTrue(Question question);
}
