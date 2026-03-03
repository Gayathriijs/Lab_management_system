-- Create Database
CREATE DATABASE IF NOT EXISTS labsync_db;
USE labsync_db;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_college_id (college_id),
    INDEX idx_role (role)
);

-- Labs Table
CREATE TABLE labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    semester INT NOT NULL,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id)
);

-- Lab Enrollments Table
CREATE TABLE lab_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (lab_id, student_id),
    INDEX idx_student (student_id)
);

-- Syllabus Table
CREATE TABLE syllabus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lab (lab_id)
);

-- Experiments Table
CREATE TABLE experiments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    experiment_date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lab_date (lab_id, experiment_date)
);

-- Attendance Table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    lab_id INT NOT NULL,
    experiment_id INT,
    check_in_time DATETIME NOT NULL,
    check_out_time DATETIME,
    status ENUM('present', 'absent', 'late') DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE SET NULL,
    INDEX idx_student_lab (student_id, lab_id),
    INDEX idx_date (check_in_time)
);

-- Record Submissions Table
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    experiment_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    marks DECIMAL(5,2),
    remarks TEXT,
    evaluated_by INT,
    evaluated_at DATETIME,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_exp (student_id, experiment_id),
    INDEX idx_status (status)
);

-- Output Verifications Table
CREATE TABLE output_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    experiment_id INT NOT NULL,
    file_path VARCHAR(500),
    notes TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_exp (student_id, experiment_id)
);

-- Quizzes Table
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    experiment_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    duration_minutes INT DEFAULT 30,
    total_marks DECIMAL(5,2) DEFAULT 10.00,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_experiment (experiment_id)
);

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500),
    option_b VARCHAR(500),
    option_c VARCHAR(500),
    option_d VARCHAR(500),
    correct_answer ENUM('a', 'b', 'c', 'd') NOT NULL,
    marks DECIMAL(5,2) DEFAULT 1.00,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz (quiz_id)
);

-- Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    total_marks DECIMAL(5,2) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt (quiz_id, student_id),
    INDEX idx_student (student_id)
);

-- Quiz Answers Table (stores student answers)
CREATE TABLE quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer ENUM('a', 'b', 'c', 'd') NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_answer (attempt_id, question_id)
);

-- Viva Scores Table
CREATE TABLE viva_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    experiment_id INT NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) DEFAULT 10.00,
    remarks TEXT,
    evaluated_by INT NOT NULL,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_viva (student_id, experiment_id),
    INDEX idx_student_exp (student_id, experiment_id)
);

-- Performance Summary Table (cached/computed performance metrics)
CREATE TABLE performance_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    lab_id INT NOT NULL,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    avg_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    avg_viva_score DECIMAL(5,2) DEFAULT 0.00,
    submission_rate DECIMAL(5,2) DEFAULT 0.00,
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_performance (student_id, lab_id),
    INDEX idx_student (student_id),
    INDEX idx_lab (lab_id)
);

-- Insert sample data for testing

-- Insert Teachers
INSERT INTO users (college_id, name, email, password_hash, role) VALUES
('TCH001', 'Dr. Rajesh Kumar', 'rajesh@toch.edu', '$2b$12$dummy_hash_teacher_1', 'teacher'),
('TCH002', 'Prof. Priya Nair', 'priya@toch.edu', '$2b$12$dummy_hash_teacher_2', 'teacher');

-- Insert Students
INSERT INTO users (college_id, name, email, password_hash, role) VALUES
('STU001', 'Arjun Menon', 'arjun@student.toch.edu', '$2b$12$dummy_hash_student_1', 'student'),
('STU002', 'Sneha Krishnan', 'sneha@student.toch.edu', '$2b$12$dummy_hash_student_2', 'student'),
('STU003', 'Rahul Varma', 'rahul@student.toch.edu', '$2b$12$dummy_hash_student_3', 'student');