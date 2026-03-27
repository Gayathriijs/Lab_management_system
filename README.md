# LabTrack — Lab Management System

A full-stack web application for managing college laboratory sessions at **Toc H Institute of Science and Technology**. Teachers can manage experiments, attendance, submissions, quizzes, and student performance. Students can access their labs, submit records, take quizzes, and track their progress.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Default Credentials](#default-credentials)

---

## Features

### Teacher
- View and manage labs with live student enrollment panel (enroll / remove students)
- Upload syllabus PDFs per lab
- Create experiments with optional documentation files
- Track daily and monthly attendance
- Evaluate student record submissions (accept / reject with marks & remarks)
- Verify output uploads from students
- Conduct viva evaluations and record scores
- Generate and deploy AI-assisted quizzes per experiment
- View class-wide and individual student performance dashboards

### Student
- View enrolled labs and their experiments
- Download syllabus and experiment files
- Submit lab records and output files
- Attempt timed quizzes
- Track personal performance (attendance %, quiz scores, viva scores, submission rate, overall score)

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python / Flask | 3.0 | REST API server |
| PyMySQL | 1.1 | MySQL database connector |
| PyJWT | 2.8 | JWT authentication |
| bcrypt | 4.1 | Password hashing |
| Flask-CORS | 4.0 | Cross-origin resource sharing |
| python-dotenv | 1.0 | Environment variable management |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| Vite | 6.0 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| React Router | 6.30 | Client-side routing |
| Axios | 1.13 | HTTP client |
| Recharts | 2.15 | Performance charts |
| Lucide React | 0.469 | Icon library |
| React Hot Toast | 2.6 | Notifications |
| TanStack Query | 5.90 | Server state management |

### Database
- **MySQL** with 13 tables covering users, labs, enrollments, experiments, attendance, submissions, output verifications, quizzes, quiz questions/attempts/answers, viva scores, and performance summaries.

---

## Project Structure

```
Lab_management_system/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory, CORS, blueprint registration
│   │   ├── auth.py              # JWT generation, bcrypt password hashing, decorators
│   │   ├── config.py            # DB config, JWT config, upload folder paths
│   │   ├── models.py            # Database class (execute_query), User, Lab, Experiment models
│   │   ├── utils.py             # File save, field validation, formatting helpers
│   │   ├── routes/
│   │   │   ├── auth_routes.py   # POST /api/auth/login, /register, GET /verify
│   │   │   ├── teacher_routes.py# All /api/teacher/* endpoints
│   │   │   └── student_routes.py# All /api/student/* endpoints
│   │   └── services/
│   │       ├── performance_service.py  # Computes student & class performance metrics
│   │       └── quiz_service.py         # Quiz generation logic
│   ├── uploads/
│   │   ├── syllabus/
│   │   ├── experiments/
│   │   ├── records/
│   │   └── outputs/
│   ├── schema.sql               # Full DB schema + sample seed data
│   ├── seed_data.py             # Python seeder (hashed passwords)
│   ├── requirements.txt
│   ├── run.py                   # Flask dev server entry point
│   └── .env                     # Environment variables (not committed)
│
└── lab-management-frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js         # Axios instance with base URL & auth interceptor
    │   │   ├── auth.js          # login, register, verifyToken
    │   │   ├── teacher.js       # All teacher API calls
    │   │   └── student.js       # All student API calls
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state (user, token, login, logout)
    │   ├── hooks/
    │   │   └── useAuth.js       # useAuth() hook
    │   ├── components/common/   # Navbar, Modal, Loading, Card, Pagination, etc.
    │   ├── pages/
    │   │   ├── auth/            # Login, Register
    │   │   ├── teacher/         # TeacherDashboard, Experiments, Attendance,
    │   │   │                    # Performance, Submissions, Syllabus, TeacherQuizzes
    │   │   └── student/         # StudentDashboard, MyLabs, Quizzes, MyPerformance
    │   ├── utils/               # constants, exportHelper, fileHelper, helpers
    │   ├── App.jsx              # Route definitions & role-based protected routes
    │   └── main.jsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Database Schema

13 tables:

| Table | Description |
|---|---|
| `users` | Teachers and students (role ENUM) |
| `labs` | Lab courses owned by a teacher |
| `lab_enrollments` | Student ↔ Lab many-to-many |
| `syllabus` | PDF files uploaded per lab |
| `experiments` | Lab sessions with optional file attachment |
| `attendance` | Per-student check-in/out records |
| `submissions` | Student record uploads, evaluated by teacher |
| `output_verifications` | Student output uploads, verified by teacher |
| `quizzes` | Quiz metadata linked to an experiment |
| `quiz_questions` | MCQ questions (A–D options) |
| `quiz_attempts` | One attempt per student per quiz |
| `quiz_answers` | Per-question answers for each attempt |
| `viva_scores` | Teacher-assigned viva marks per experiment |
| `performance_summary` | Cached metrics updated by `PerformanceService` |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### 1. Clone the repository

```bash
git clone https://github.com/Gayathriijs/Lab_management_system.git
cd Lab_management_system
```

### 2. Set up the database

```sql
mysql -u root -p
source backend/schema.sql
```

### 3. Set up the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configure environment variables

Create `backend/.env`:

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=labsync_db
MYSQL_PORT=3306
```

### 5. Seed the database

```bash
cd backend
python seed_data.py
```

### 6. Set up the frontend

```bash
cd lab-management-frontend
npm install
```

---

## Running the Application

You need **two terminals** running simultaneously.

**Terminal 1 — Backend (Flask)**
```bash
cd backend
venv\Scripts\Activate.ps1      # Windows
# source venv/bin/activate      # macOS/Linux
python run.py
```
Backend runs at: `http://localhost:5000`

**Terminal 2 — Frontend (Vite)**
```bash
cd lab-management-frontend
npm run dev
```
Frontend runs at: `http://localhost:3000`

---

## API Overview

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/login` | Login with college_id + password → JWT token |
| POST | `/register` | Create new student/teacher account |
| GET | `/verify` | Verify JWT token validity |

### Teacher — `/api/teacher` *(JWT required, role: teacher)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/labs` | Get all labs managed by the teacher |
| GET | `/labs/:id/students` | Get enrolled & unenrolled students for a lab |
| POST | `/labs/:id/enroll` | Enroll a student into a lab |
| DELETE | `/labs/:id/unenroll/:studentId` | Remove a student from a lab |
| POST | `/syllabus/upload` | Upload syllabus PDF |
| GET | `/syllabus/:labId` | Get syllabus list for a lab |
| POST | `/experiment/create` | Create a new experiment |
| GET | `/experiments/:labId` | List experiments in a lab |
| GET | `/attendance/daily/:labId` | Daily attendance for a lab |
| GET | `/attendance/monthly/:labId` | Monthly attendance summary |
| GET | `/attendance/absentees/:labId` | Students below attendance threshold |
| GET | `/performance/student/:studentId/:labId` | Individual student performance |
| GET | `/performance/class/:labId` | Class-wide performance metrics |
| GET | `/submissions/pending/:labId` | Pending record submissions |
| POST | `/submissions/evaluate/:id` | Evaluate a submission |
| POST | `/viva/add` | Record viva score for a student |
| POST | `/quiz/generate/:experimentId` | Generate a quiz |
| POST | `/quiz/deploy/:quizId` | Activate a quiz for students |
| GET | `/quiz/results/:quizId` | Quiz attempt results |

### Student — `/api/student` *(JWT required, role: student)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/labs` | Get enrolled labs |
| GET | `/experiments/:labId` | Get experiments in a lab |
| GET | `/syllabus/:labId` | Get syllabus for a lab |
| POST | `/submit/record` | Submit lab record file |
| POST | `/submit/output` | Submit output verification file |
| GET | `/quizzes/:labId` | Get available quizzes |
| POST | `/quiz/start/:quizId` | Start a quiz attempt |
| POST | `/quiz/submit/:attemptId` | Submit quiz answers |
| GET | `/performance/:labId` | Get personal performance metrics |

---

## Default Credentials

After running `seed_data.py`:

| Role | College ID | Password |
|---|---|---|
| Teacher | TCH001 | password123 |
| Teacher | TCH002 | password123 |
| Student | STU001 | password123 |
| Student | STU002 | password123 |
| Student | STU003 | password123 |

> **Note:** All demo passwords are hashed with bcrypt before storage. Never use dummy credentials in production.

---

## Security Notes

- Passwords are hashed using **bcrypt** (never stored in plain text)
- All protected routes use **JWT Bearer token** authentication
- Teachers can only access data for labs they own (ownership check on every route)
- File uploads are restricted to PDF, PNG, JPG, DOC/DOCX and limited to **16 MB**
- CORS is configured to `"origins": "*"` for development — **restrict to your domain in production**
- Secret keys must be changed via `.env` before any deployment

---

## License

This project is developed for academic purposes at Toc H Institute of Science and Technology.
