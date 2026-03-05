# Lab Management System - API Reference Guide

Complete API documentation with frontend integration examples.

---

## 📋 Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [Authentication API](#authentication-api)
3. [Student API](#student-api)
4. [Teacher API](#teacher-api)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)

---

## Setup & Configuration

### Base URL
```
Production: http://localhost:5000
Development: /api (proxied via Vite)
```

### Headers
All requests must include:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Frontend Configuration
**File:** `src/api/axios.js`
```javascript
const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-adds token to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

# 🔐 Authentication API

**Base URL:** `/api/auth`  
**Authentication:** Not required for login/register, required for verify

---

## 1. Login User

### Endpoint
```
POST /api/auth/login
```

### Description
Authenticates a user and returns JWT token for subsequent requests.

### Request
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "college_id": "STU001",
  "password": "password123"
}
```

### Response (200 OK)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "college_id": "STU001",
    "name": "John Doe",
    "email": "john@student.toch.edu",
    "role": "student"
  }
}
```

### Error Responses
| Status | Error | Reason |
|--------|-------|--------|
| 400 | Missing fields | college_id or password not provided |
| 401 | Invalid credentials | Wrong college_id or password |
| 500 | Internal error | Server error |

### Frontend Usage
```javascript
import { authAPI } from './api/auth';

const handleLogin = async (collegeId, password) => {
  try {
    const response = await authAPI.login({
      college_id: collegeId,
      password: password,
    });
    
    // Store token and user
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Navigate based on role
    if (response.user.role === 'teacher') {
      navigate('/teacher/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  } catch (error) {
    toast.error(error.response?.data?.error || 'Login failed');
  }
};
```

---

## 2. Register User

### Endpoint
```
POST /api/auth/register
```

### Description
Creates a new user account with hashed password.

### Request
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "college_id": "STU004",
  "name": "New Student",
  "email": "new@student.toch.edu",
  "password": "password123",
  "role": "student"
}
```

### Response (201 Created)
```json
{
  "message": "User registered successfully",
  "user_id": 4
}
```

### Error Responses
| Status | Error | Reason |
|--------|-------|--------|
| 400 | Missing fields | Required fields not provided |
| 400 | Invalid role | Role must be 'student' or 'teacher' |
| 409 | User exists | College ID already registered |
| 500 | Internal error | Server error |

### Frontend Usage
```javascript
const handleRegister = async (formData) => {
  try {
    const response = await authAPI.register({
      college_id: formData.collegeId,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role, // 'student' or 'teacher'
    });
    
    toast.success('Registration successful! Please login.');
    navigate('/login');
  } catch (error) {
    toast.error(error.response?.data?.error || 'Registration failed');
  }
};
```

---

## 3. Verify Token

### Endpoint
```
GET /api/auth/verify
```

### Description
Validates JWT token and returns current user details.

### Request
```javascript
GET /api/auth/verify
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "college_id": "STU001",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Error Responses
| Status | Error | Reason |
|--------|-------|--------|
| 401 | Invalid/expired token | Token missing or expired |
| 500 | Internal error | Server error |

### Frontend Usage
```javascript
// Verify token on app load (in AuthContext)
const verifyToken = async () => {
  try {
    const response = await authAPI.verifyToken();
    if (response.valid) {
      setUser(response.user);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch (error) {
    // Token invalid, logout
    logout();
  }
};
```

---

# 🎓 Student API

**Base URL:** `/api/student`  
**Authentication:** Required (Bearer token)  
**Role:** student

---

## 1. Get Enrolled Labs

### Endpoint
```
GET /api/student/labs
```

### Response (200 OK)
```json
{
  "labs": [
    {
      "id": 1,
      "name": "Data Structures Lab",
      "code": "CSE201L",
      "semester": 3,
      "teacher_name": "Dr. Rajesh Kumar"
    }
  ]
}
```

### Frontend Usage
```javascript
const loadLabs = async () => {
  try {
    const data = await studentAPI.getEnrolledLabs();
    setLabs(data.labs);
  } catch (error) {
    toast.error('Failed to load labs');
  }
};
```

---

## 2. Get Lab Syllabus

### Endpoint
```
GET /api/student/syllabus/{lab_id}
```

### Response (200 OK)
```json
{
  "syllabus": [
    {
      "id": 1,
      "title": "Data Structures Lab Syllabus",
      "file_path": "/uploads/syllabus/...",
      "uploaded_at": "2024-01-15 10:30:00"
    }
  ]
}
```

### Frontend Usage
```javascript
const loadSyllabus = async (labId) => {
  try {
    const data = await studentAPI.getSyllabus(labId);
    setSyllabus(data.syllabus);
  } catch (error) {
    toast.error('Failed to load syllabus');
  }
};
```

---

## 3. Get Experiments

### Endpoint
```
GET /api/student/experiments/{lab_id}
```

### Response (200 OK)
```json
{
  "experiments": [
    {
      "id": 5,
      "title": "Arrays and Linked Lists",
      "description": "Implement basic data structures",
      "file_path": "/uploads/experiments/...",
      "experiment_date": "2024-02-15",
      "record_submitted": false,
      "record_status": "pending",
      "output_submitted": false,
      "quiz_attempted": false
    }
  ]
}
```

### Frontend Usage
```javascript
const [selectedLab, setSelectedLab] = useState(null);

useEffect(() => {
  if (selectedLab) {
    loadExperiments();
  }
}, [selectedLab]);

const loadExperiments = async () => {
  try {
    const data = await studentAPI.getExperiments(selectedLab);
    setExperiments(data.experiments);
  } catch (error) {
    toast.error('Failed to load experiments');
  }
};
```

---

## 4. Get Experiment Details

### Endpoint
```
GET /api/student/experiment/{experiment_id}
```

### Response (200 OK)
```json
{
  "experiment": {
    "id": 5,
    "title": "Arrays",
    "description": "...",
    "experiment_date": "2024-02-15"
  },
  "submission_status": {
    "record_submitted": false,
    "output_submitted": false
  },
  "quiz_info": {
    "quiz_id": 3,
    "title": "Arrays Quiz",
    "attempted": false
  }
}
```

### Frontend Usage
```javascript
const viewExperimentDetails = async (experimentId) => {
  try {
    const data = await studentAPI.getExperimentDetails(experimentId);
    setExperimentDetails(data);
  } catch (error) {
    toast.error('Failed to load experiment details');
  }
};
```

---

## 5. Attendance Check-In

### Endpoint
```
POST /api/student/attendance/check-in
```

### Request
```json
{
  "lab_id": 1,
  "experiment_id": 5
}
```

### Response (201 Created)
```json
{
  "message": "Check-in successful",
  "attendance_id": 42,
  "check_in_time": "2024-02-15 10:30:00"
}
```

### Frontend Usage
```javascript
const handleCheckIn = async (labId, experimentId) => {
  try {
    const response = await studentAPI.checkIn({
      lab_id: labId,
      experiment_id: experimentId,
    });
    toast.success('Checked in successfully');
    setAttendanceId(response.attendance_id);
  } catch (error) {
    toast.error('Check-in failed');
  }
};
```

---

## 6. Attendance Check-Out

### Endpoint
```
POST /api/student/attendance/check-out/{attendance_id}
```

### Response (200 OK)
```json
{
  "message": "Check-out successful",
  "check_out_time": "2024-02-15 12:30:00"
}
```

### Frontend Usage
```javascript
const handleCheckOut = async (attendanceId) => {
  try {
    const response = await studentAPI.checkOut(attendanceId);
    toast.success('Checked out successfully');
  } catch (error) {
    toast.error('Check-out failed');
  }
};
```

---

## 7. Get My Attendance

### Endpoint
```
GET /api/student/attendance/my-attendance/{lab_id}
```

### Response (200 OK)
```json
{
  "total_sessions": 10,
  "attended": 9,
  "attendance_percentage": 90.0,
  "records": [
    {
      "date": "2024-02-15",
      "check_in_time": "10:30:00",
      "check_out_time": "12:30:00",
      "status": "present"
    }
  ]
}
```

### Frontend Usage
```javascript
const loadAttendance = async (labId) => {
  try {
    const data = await studentAPI.getMyAttendance(labId);
    setAttendanceData(data);
  } catch (error) {
    toast.error('Failed to load attendance');
  }
};
```

---

## 8. Upload Record (Lab Record/Report)

### Endpoint
```
POST /api/student/submission/upload
```

### Request (Form-Data)
```javascript
const formData = new FormData();
formData.append('experiment_id', 5);
formData.append('file', pdfFile); // PDF or DOC file
```

### Response (201 Created)
```json
{
  "message": "Record submitted successfully",
  "submission_id": 123
}
```

### Frontend Usage
```javascript
const handleRecordUpload = async (experimentId, file) => {
  try {
    const formData = new FormData();
    formData.append('experiment_id', experimentId);
    formData.append('file', file);
    
    const response = await studentAPI.uploadRecord(formData);
    toast.success('Record submitted successfully');
  } catch (error) {
    toast.error('Failed to upload record');
  }
};
```

---

## 9. Upload Output (Experiment Output)

### Endpoint
```
POST /api/student/output/upload
```

### Request (Form-Data)
```javascript
const formData = new FormData();
formData.append('experiment_id', 5);
formData.append('file', outputFile); // Any file type
formData.append('notes', 'Experiment results'); // Optional
```

### Response (201 Created)
```json
{
  "message": "Output submitted successfully",
  "output_id": 456
}
```

### Frontend Usage
```javascript
const handleOutputUpload = async (experimentId, file, notes) => {
  try {
    const formData = new FormData();
    formData.append('experiment_id', experimentId);
    formData.append('file', file);
    if (notes) formData.append('notes', notes);
    
    const response = await studentAPI.uploadOutput(formData);
    toast.success('Output submitted successfully');
  } catch (error) {
    toast.error('Failed to upload output');
  }
};
```

---

## 10. Get Available Quizzes

### Endpoint
```
GET /api/student/quiz/available/{lab_id}
```

### Response (200 OK)
```json
{
  "quizzes": [
    {
      "quiz_id": 3,
      "title": "Arrays Quiz",
      "experiment_title": "Arrays and Linked Lists",
      "duration_minutes": 30,
      "total_marks": 20.0,
      "attempted": false
    }
  ]
}
```

### Frontend Usage
```javascript
const loadQuizzes = async (labId) => {
  try {
    const data = await studentAPI.getAvailableQuizzes(labId);
    setQuizzes(data.quizzes);
  } catch (error) {
    toast.error('Failed to load quizzes');
  }
};
```

---

## 11. Start Quiz

### Endpoint
```
POST /api/student/quiz/start/{quiz_id}
```

### Response (200 OK)
```json
{
  "attempt_id": 789,
  "quiz_title": "Arrays Quiz",
  "duration_minutes": 30,
  "total_marks": 20.0,
  "questions": [
    {
      "id": 101,
      "question_text": "What is an array?",
      "option_a": "Ordered collection",
      "option_b": "Unordered collection",
      "option_c": "Linked structure",
      "option_d": "Tree structure",
      "marks": 2.0
    }
  ]
}
```

### Frontend Usage
```javascript
const startQuiz = async (quizId) => {
  try {
    const data = await studentAPI.startQuiz(quizId);
    setAttemptId(data.attempt_id);
    setQuestions(data.questions);
    setTimeLeft(data.duration_minutes * 60); // Convert to seconds
  } catch (error) {
    toast.error('Failed to start quiz');
  }
};
```

---

## 12. Submit Quiz

### Endpoint
```
POST /api/student/quiz/submit/{attempt_id}
```

### Request
```json
{
  "answers": [
    {
      "question_id": 101,
      "selected_answer": "option_a"
    },
    {
      "question_id": 102,
      "selected_answer": "option_c"
    }
  ]
}
```

### Response (200 OK)
```json
{
  "message": "Quiz submitted successfully",
  "score": 18.5,
  "total_marks": 20.0,
  "percentage": 92.5
}
```

### Frontend Usage
```javascript
const submitQuiz = async (attemptId, answers) => {
  try {
    const response = await studentAPI.submitQuiz(attemptId, answers);
    toast.success(`Quiz submitted! Score: ${response.score}/${response.total_marks}`);
    navigate('/student/dashboard');
  } catch (error) {
    toast.error('Failed to submit quiz');
  }
};
```

---

## 13. Get Quiz Result

### Endpoint
```
GET /api/student/quiz/result/{attempt_id}
```

### Response (200 OK)
```json
{
  "quiz_title": "Arrays Quiz",
  "score": 18.5,
  "total_marks": 20.0,
  "percentage": 92.5,
  "submitted_at": "2024-02-15 11:45:00",
  "answers": [
    {
      "question_id": 101,
      "question_text": "What is an array?",
      "selected_answer": "option_a",
      "correct_answer": "option_a",
      "is_correct": true,
      "marks_earned": 2.0
    }
  ]
}
```

### Frontend Usage
```javascript
const viewQuizResult = async (attemptId) => {
  try {
    const data = await studentAPI.getQuizResult(attemptId);
    setQuizResult(data);
  } catch (error) {
    toast.error('Failed to load quiz result');
  }
};
```

---

## 14. Get Performance Dashboard

### Endpoint
```
GET /api/student/performance/{lab_id}
```

### Response (200 OK)
```json
{
  "attendance_percentage": 90.0,
  "avg_viva_marks": 8.5,
  "submission_rate": 85.0,
  "avg_quiz_score": 85.0,
  "overall_score": 87.1
}
```

### Frontend Usage
```javascript
const loadPerformance = async (labId) => {
  try {
    const data = await studentAPI.getMyPerformance(labId);
    setPerformanceMetrics(data);
  } catch (error) {
    toast.error('Failed to load performance data');
  }
};
```

---

## 15. Get Lab Calendar

### Endpoint
```
GET /api/student/calendar/{lab_id}?month=2024-02
```

### Response (200 OK)
```json
{
  "month": "2024-02",
  "sessions": [
    {
      "date": "2024-02-15",
      "experiment_title": "Arrays",
      "attended": true,
      "record_submitted": false,
      "quiz_attempted": false
    }
  ]
}
```

### Frontend Usage
```javascript
const loadCalendar = async (labId, month) => {
  try {
    const data = await studentAPI.getLabCalendar(labId, month);
    setCalendarData(data);
  } catch (error) {
    toast.error('Failed to load calendar');
  }
};
```

---

# 👨‍🏫 Teacher API

**Base URL:** `/api/teacher`  
**Authentication:** Required (Bearer token)  
**Role:** teacher

---

## 1. Upload Syllabus

### Endpoint
```
POST /api/teacher/syllabus/upload
```

### Request (Form-Data)
```javascript
const formData = new FormData();
formData.append('lab_id', 1);
formData.append('title', 'Data Structures Lab Syllabus');
formData.append('file', pdfFile); // Must be PDF
```

### Response (201 Created)
```json
{
  "message": "Syllabus uploaded successfully",
  "syllabus_id": 1
}
```

### Frontend Usage
```javascript
const uploadSyllabus = async (labId, title, file) => {
  try {
    const formData = new FormData();
    formData.append('lab_id', labId);
    formData.append('title', title);
    formData.append('file', file);
    
    const response = await teacherAPI.uploadSyllabus(formData);
    toast.success('Syllabus uploaded successfully');
  } catch (error) {
    toast.error('Failed to upload syllabus');
  }
};
```

---

## 2. Get Lab Syllabus

### Endpoint
```
GET /api/teacher/syllabus/{lab_id}
```

### Response (200 OK)
```json
{
  "syllabus": [
    {
      "id": 1,
      "title": "Data Structures Lab Syllabus",
      "file_path": "/uploads/syllabus/...",
      "uploaded_at": "2024-01-15 10:30:00"
    }
  ]
}
```

---

## 3. Create Experiment

### Endpoint
```
POST /api/teacher/experiment/create
```

### Request (Form-Data)
```javascript
const formData = new FormData();
formData.append('lab_id', 1);
formData.append('title', 'Arrays and Linked Lists');
formData.append('description', 'Implement basic data structures');
formData.append('experiment_date', '2024-02-15');
formData.append('file', experimentFile); // Optional PDF
```

### Response (201 Created)
```json
{
  "message": "Experiment created successfully",
  "experiment_id": 5
}
```

### Frontend Usage
```javascript
const createExperiment = async (formData) => {
  try {
    const data = new FormData();
    data.append('lab_id', formData.labId);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('experiment_date', formData.experimentDate);
    if (formData.file) data.append('file', formData.file);
    
    const response = await teacherAPI.createExperiment(data);
    toast.success('Experiment created successfully');
  } catch (error) {
    toast.error('Failed to create experiment');
  }
};
```

---

## 4. Get Experiments

### Endpoint
```
GET /api/teacher/experiments/{lab_id}
```

### Response (200 OK)
```json
{
  "experiments": [
    {
      "id": 5,
      "title": "Arrays",
      "description": "...",
      "experiment_date": "2024-02-15",
      "created_at": "2024-01-20 10:30:00"
    }
  ]
}
```

---

## 5. Daily Attendance Report

### Endpoint
```
GET /api/teacher/attendance/daily/{lab_id}?date=2024-02-15
```

### Response (200 OK)
```json
{
  "date": "2024-02-15",
  "total_students": 30,
  "present": 28,
  "absent": 2,
  "attendance_list": [
    {
      "student_name": "John Doe",
      "college_id": "STU001",
      "check_in_time": "10:30:00",
      "check_out_time": "12:30:00",
      "status": "present"
    }
  ]
}
```

### Frontend Usage
```javascript
const loadDailyAttendance = async (labId, date) => {
  try {
    const data = await teacherAPI.getDailyAttendance(labId, date);
    setAttendanceData(data);
  } catch (error) {
    toast.error('Failed to load attendance');
  }
};
```

---

## 6. Monthly Attendance Report

### Endpoint
```
GET /api/teacher/attendance/monthly/{lab_id}?month=2024-02
```

### Response (200 OK)
```json
{
  "month": "2024-02",
  "total_students": 30,
  "summary": [
    {
      "date": "2024-02-01",
      "present": 28,
      "absent": 2
    }
  ]
}
```

---

## 7. Get Frequent Absentees

### Endpoint
```
GET /api/teacher/attendance/absentees/{lab_id}?threshold=3
```

### Response (200 OK)
```json
{
  "absentees": [
    {
      "student_name": "Jane Smith",
      "college_id": "STU010",
      "total_classes": 10,
      "attended": 6,
      "absent": 4,
      "attendance_percentage": 60.0
    }
  ]
}
```

---

## 8. Student Performance Details

### Endpoint
```
GET /api/teacher/performance/student/{student_id}/{lab_id}
```

### Response (200 OK)
```json
{
  "student": {
    "id": 1,
    "name": "John Doe",
    "college_id": "STU001"
  },
  "attendance_percentage": 90.0,
  "avg_viva_marks": 8.5,
  "submission_rate": 85.0,
  "avg_quiz_score": 85.0,
  "overall_score": 87.1,
  "details": {
    "total_experiments": 10,
    "records_submitted": 9,
    "outputs_submitted": 8,
    "quizzes_attempted": 10
  }
}
```

### Frontend Usage
```javascript
const viewStudentPerformance = async (studentId, labId) => {
  try {
    const data = await teacherAPI.getStudentPerformance(studentId, labId);
    setStudentPerformance(data);
  } catch (error) {
    toast.error('Failed to load student performance');
  }
};
```

---

## 9. Class Performance Analytics

### Endpoint
```
GET /api/teacher/performance/class/{lab_id}
```

### Response (200 OK)
```json
{
  "lab_name": "Data Structures Lab",
  "total_students": 30,
  "class_average": {
    "attendance_percentage": 85.0,
    "avg_viva_marks": 7.8,
    "submission_rate": 80.0,
    "avg_quiz_score": 82.0,
    "overall_score": 83.7
  },
  "top_performers": [
    {
      "student_name": "John Doe",
      "college_id": "STU001",
      "overall_score": 95.0
    }
  ],
  "bottom_performers": [
    {
      "student_name": "Jane Smith",
      "college_id": "STU010",
      "overall_score": 60.0
    }
  ]
}
```

### Frontend Usage
```javascript
const loadClassPerformance = async (labId) => {
  try {
    const data = await teacherAPI.getClassPerformance(labId);
    setClassPerformance(data);
  } catch (error) {
    toast.error('Failed to load class performance');
  }
};
```

---

## 10. Get Pending Submissions

### Endpoint
```
GET /api/teacher/submissions/pending/{lab_id}
```

### Response (200 OK)
```json
{
  "pending_submissions": [
    {
      "submission_id": 123,
      "student_name": "John Doe",
      "college_id": "STU001",
      "experiment_title": "Arrays",
      "submitted_at": "2024-02-15 11:45:00",
      "file_path": "/uploads/records/..."
    }
  ]
}
```

### Frontend Usage
```javascript
const loadPendingSubmissions = async (labId) => {
  try {
    const data = await teacherAPI.getPendingSubmissions(labId);
    setSubmissions(data.pending_submissions);
  } catch (error) {
    toast.error('Failed to load submissions');
  }
};
```

---

## 11. Evaluate Submission

### Endpoint
```
POST /api/teacher/submissions/evaluate/{submission_id}
```

### Request
```json
{
  "status": "accepted",
  "marks": 8.5,
  "remarks": "Good work, could improve presentation"
}
```

### Response (200 OK)
```json
{
  "message": "Submission evaluated successfully"
}
```

### Frontend Usage
```javascript
const evaluateSubmission = async (submissionId, status, marks, remarks) => {
  try {
    await teacherAPI.evaluateSubmission(submissionId, {
      status: status, // "accepted" or "rejected"
      marks: marks,
      remarks: remarks,
    });
    toast.success('Submission evaluated');
  } catch (error) {
    toast.error('Failed to evaluate submission');
  }
};
```

---

## 12. Get Pending Outputs

### Endpoint
```
GET /api/teacher/outputs/pending/{lab_id}
```

### Response (200 OK)
```json
{
  "pending_outputs": [
    {
      "output_id": 456,
      "student_name": "John Doe",
      "college_id": "STU001",
      "experiment_title": "Arrays",
      "submitted_at": "2024-02-15 11:45:00",
      "file_path": "/uploads/outputs/..."
    }
  ]
}
```

---

## 13. Verify Output

### Endpoint
```
POST /api/teacher/outputs/verify/{output_id}
```

### Request
```json
{
  "verified": true
}
```

### Response (200 OK)
```json
{
  "message": "Output verified successfully"
}
```

### Frontend Usage
```javascript
const verifyOutput = async (outputId, verified) => {
  try {
    await teacherAPI.verifyOutput(outputId, verified);
    toast.success(verified ? 'Output verified' : 'Output rejected');
  } catch (error) {
    toast.error('Failed to verify output');
  }
};
```

---

## 14. Add Viva Score

### Endpoint
```
POST /api/teacher/viva/add
```

### Request
```json
{
  "student_id": 1,
  "experiment_id": 5,
  "marks": 9.0,
  "max_marks": 10.0,
  "remarks": "Excellent understanding"
}
```

### Response (200 OK)
```json
{
  "message": "Viva score added successfully"
}
```

### Frontend Usage
```javascript
const addVivaScore = async (studentId, experimentId, marks, remarks) => {
  try {
    await teacherAPI.addVivaScore({
      student_id: studentId,
      experiment_id: experimentId,
      marks: marks,
      max_marks: 10.0,
      remarks: remarks,
    });
    toast.success('Viva score recorded');
  } catch (error) {
    toast.error('Failed to add viva score');
  }
};
```

---

## 15. Generate Quiz (AI-Powered)

### Endpoint
```
POST /api/teacher/quiz/generate/{experiment_id}
```

### Request
```json
{
  "title": "Arrays Quiz",
  "num_questions": 5,
  "duration_minutes": 30
}
```

### Response (201 Created)
```json
{
  "message": "Quiz generated successfully",
  "quiz_id": 3,
  "questions": [
    {
      "id": 101,
      "question_text": "What is an array?",
      "marks": 2.0
    }
  ]
}
```

### Frontend Usage
```javascript
const generateQuiz = async (experimentId, title, numQuestions, duration) => {
  try {
    const response = await teacherAPI.generateQuiz(experimentId, {
      title: title,
      num_questions: numQuestions,
      duration_minutes: duration,
    });
    toast.success('Quiz generated successfully');
  } catch (error) {
    toast.error('Failed to generate quiz');
  }
};
```

---

## 16. Deploy Quiz

### Endpoint
```
POST /api/teacher/quiz/deploy/{quiz_id}
```

### Response (200 OK)
```json
{
  "message": "Quiz deployed successfully"
}
```

### Frontend Usage
```javascript
const deployQuiz = async (quizId) => {
  try {
    await teacherAPI.deployQuiz(quizId);
    toast.success('Quiz deployed to students');
  } catch (error) {
    toast.error('Failed to deploy quiz');
  }
};
```

---

## 17. Get Quiz Results

### Endpoint
```
GET /api/teacher/quiz/results/{quiz_id}
```

### Response (200 OK)
```json
{
  "quiz_title": "Arrays Quiz",
  "total_attempts": 28,
  "average_score": 82.5,
  "results": [
    {
      "student_name": "John Doe",
      "college_id": "STU001",
      "score": 18.5,
      "total_marks": 20.0,
      "percentage": 92.5,
      "submitted_at": "2024-02-15 11:45:00"
    }
  ]
}
```

### Frontend Usage
```javascript
const viewQuizResults = async (quizId) => {
  try {
    const data = await teacherAPI.getQuizResults(quizId);
    setQuizResults(data);
  } catch (error) {
    toast.error('Failed to load quiz results');
  }
};
```

---

# ❌ Error Handling

## Global Error Handler

**File:** `src/api/axios.js`

```javascript
// Response interceptor handles auth errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear authentication
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Standard Error Response Format

All endpoints return errors in this format:

```json
{
  "error": "Description of error"
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Re-login required |
| 403 | Forbidden | Check user role/permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Contact support |

## Frontend Error Handling Best Practices

```javascript
try {
  const data = await studentAPI.getEnrolledLabs();
  setLabs(data.labs);
} catch (error) {
  // Handle different error types
  if (error.response?.status === 401) {
    // Auto-handled by axios interceptor
  } else if (error.response?.status === 403) {
    toast.error('You do not have permission');
  } else if (error.response?.data?.error) {
    toast.error(error.response.data.error);
  } else {
    toast.error('An unexpected error occurred');
  }
  console.error(error);
}
```

---

# 📝 Usage Examples

## Complete Login Flow

```javascript
import { authAPI } from './api/auth';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    college_id: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call login endpoint
      const response = await authAPI.login({
        college_id: credentials.college_id,
        password: credentials.password,
      });

      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success('Login successful!');

      // Redirect based on role
      const dashboard = response.user.role === 'teacher'
        ? '/teacher/dashboard'
        : '/student/dashboard';

      navigate(dashboard, { replace: true });
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="college_id"
        placeholder="College ID"
        value={credentials.college_id}
        onChange={(e) => setCredentials({
          ...credentials,
          college_id: e.target.value
        })}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({
          ...credentials,
          password: e.target.value
        })}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Sign In'}
      </button>
    </form>
  );
};
```

## Complete Student Dashboard

```javascript
import { studentAPI } from '../../api/student';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load enrolled labs on mount
  useEffect(() => {
    loadLabs();
  }, []);

  // Load experiments when lab changes
  useEffect(() => {
    if (selectedLab) {
      loadExperiments();
      loadPerformance();
    }
  }, [selectedLab]);

  const loadLabs = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.getEnrolledLabs();
      setLabs(data.labs);
      if (data.labs.length > 0) {
        setSelectedLab(data.labs[0].id);
      }
    } catch (error) {
      toast.error('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const loadExperiments = async () => {
    try {
      const data = await studentAPI.getExperiments(selectedLab);
      setExperiments(data.experiments);
    } catch (error) {
      toast.error('Failed to load experiments');
    }
  };

  const loadPerformance = async () => {
    try {
      const data = await studentAPI.getMyPerformance(selectedLab);
      setPerformance(data);
    } catch (error) {
      console.error('Failed to load performance');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Student Dashboard</h1>

      {/* Lab Selector */}
      <select value={selectedLab || ''} onChange={(e) => setSelectedLab(Number(e.target.value))}>
        {labs.map(lab => (
          <option key={lab.id} value={lab.id}>
            {lab.name} ({lab.code})
          </option>
        ))}
      </select>

      {/* Performance Metrics */}
      {performance && (
        <div>
          <h2>Performance</h2>
          <p>Attendance: {performance.attendance_percentage}%</p>
          <p>Avg Quiz Score: {performance.avg_quiz_score}</p>
          <p>Overall Score: {performance.overall_score}</p>
        </div>
      )}

      {/* Experiments List */}
      <div>
        <h2>Experiments</h2>
        {experiments.map(exp => (
          <div key={exp.id}>
            <h3>{exp.title}</h3>
            <p>Date: {exp.experiment_date}</p>
            <p>Record: {exp.record_submitted ? '✅ Submitted' : '⏳ Pending'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Complete Teacher Dashboard

```javascript
import { teacherAPI } from '../../api/teacher';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const [selectedLab, setSelectedLab] = useState(1);
  const [classPerformance, setClassPerformance] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedLab) {
      loadDashboardData();
    }
  }, [selectedLab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load class performance
      const perfData = await teacherAPI.getClassPerformance(selectedLab);
      setClassPerformance(perfData);

      // Load pending submissions
      const subData = await teacherAPI.getPendingSubmissions(selectedLab);
      setSubmissions(subData.pending_submissions);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (submissionId, marks) => {
    try {
      await teacherAPI.evaluateSubmission(submissionId, {
        status: 'accepted',
        marks: marks,
      });
      toast.success('Submission evaluated');
      loadDashboardData(); // Refresh
    } catch (error) {
      toast.error('Failed to evaluate');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Teacher Dashboard</h1>

      {classPerformance && (
        <div>
          <h2>Class Performance</h2>
          <p>Total Students: {classPerformance.total_students}</p>
          <p>Average Score: {classPerformance.class_average.overall_score}</p>
          <p>Top Performer: {classPerformance.top_performers[0]?.student_name}</p>
        </div>
      )}

      {/* Submissions to Evaluate */}
      <div>
        <h2>Pending Submissions ({submissions.length})</h2>
        {submissions.map(sub => (
          <div key={sub.submission_id}>
            <p>{sub.student_name} - {sub.experiment_title}</p>
            <button onClick={() => handleEvaluate(sub.submission_id, 8.5)}>
              Evaluate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## File Upload Example

```javascript
import { studentAPI } from '../../api/student';
import { useState } from 'react';
import toast from 'react-hot-toast';

const FileUploadForm = ({ experimentId }) => {
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('record'); // 'record' or 'output'
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('experiment_id', experimentId);
      formData.append('file', file);

      let response;
      if (uploadType === 'record') {
        response = await studentAPI.uploadRecord(formData);
      } else {
        response = await studentAPI.uploadOutput(formData);
      }

      toast.success('File uploaded successfully');
      setFile(null);
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
        <option value="record">Lab Record (PDF)</option>
        <option value="output">Experiment Output</option>
      </select>

      <input
        type="file"
        onChange={handleFileChange}
        accept={uploadType === 'record' ? '.pdf' : '*'}
        required
      />

      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
};
```

---

# 🔍 Testing API Endpoints

## Test with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"college_id":"STU001","password":"password123"}'

# Get enrolled labs (with token)
curl -X GET http://localhost:5000/api/student/labs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get experiments
curl -X GET http://localhost:5000/api/student/experiments/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Test in Browser DevTools

```javascript
const token = localStorage.getItem('token');

// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    college_id: 'STU001',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log);

// Get labs (with token)
fetch('/api/student/labs', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log);
```

---

**Last Updated:** March 4, 2026  
**Status:** ✅ Complete API Documentation
