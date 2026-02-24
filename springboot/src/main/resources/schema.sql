-- Database Schema for IITJ Coder

drop table if exists public.submissions;
drop table if exists public.test_cases;
drop table if exists public.questions;

-- Users Table (Admin and Students)
CREATE TABLE if not exists users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'STUDENT', 'ADMIN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20),
    time_limit INTEGER DEFAULT 2000,
    memory_limit INTEGER DEFAULT 128,
    starter_code TEXT,
    visible_test_cases_json TEXT, -- [{ "input": "...", "output": "..." }]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visible Test Cases (for immediate feedback in frontend)
CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    visible BOOLEAN DEFAULT TRUE
);

-- Submissions Table
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    question_id INTEGER REFERENCES questions(id),
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'QUEUED', -- 'QUEUED', 'PROCESSING', 'ACCEPTED', 'WRONG_ANSWER', 'ERROR'
    type VARCHAR(20) DEFAULT 'SUBMISSION', -- 'RUN_VISIBLE', 'RUN_CUSTOM', 'SUBMISSION'
    result_metadata JSONB, -- detailed results per test case
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default Admin Account (username: admin, password: admin123)
-- BCrypt hash for 'admin123' is $2a$10$aD3qeNhNv0iU5g64KgpLdezIBwXHrHUTtN/t40tiqZbWV2V9V.2PO
-- INSERT INTO users (username, password, email, role)
-- VALUES ('admin', '$2a$10$aD3qeNhNv0iU5g64KgpLdezIBwXHrHUTtN/t40tiqZbWV2V9V.2PO', 'admin@iitj.ac.in', 'ADMIN')
-- ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;


select * from users;
select * from questions;
select * from submissions;


-- delete from users where username != 'admin';