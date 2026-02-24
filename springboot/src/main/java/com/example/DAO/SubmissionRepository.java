package com.example.DAO;

import com.example.bean.Submission;
import com.example.bean.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUser(User user);

    List<Submission> findByUserOrderByCreatedAtDesc(User user);
}
