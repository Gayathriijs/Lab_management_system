# Lab Management System - Setup Guide

## Prerequisites

1. **Python 3.8+**
```bash
   python --version
```

2. **MySQL 8.0+**
```bash
   mysql --version
```

3. **pip (Python package manager)**
```bash
   pip --version
```

## Installation Steps

### 1. Clone/Download Project
```bash
# If using git
git clone <repository-url>
cd lab_management_system

# Or simply create the folder structure as shown
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Database

**Create MySQL Database:**
```bash
mysql -u root -p
```
```sql
CREATE DATABASE lab_management_system;
USE lab_management_system;

-- Exit MySQL
EXIT;
```

**Import Schema:**
```bash
mysql -u root -p lab_management_system < schema.sql
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:
```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-this-in-production

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=lab_management_system
MYSQL_PORT=3306

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-this-too
```

**Important:** Change all secret keys in production!

### 6. Update Configuration

Edit `app/config.py` and update database credentials if not using environment variables.

### 7. Create Upload Folders

The application will create these automatically, but you can create them manually:
```bash
mkdir -p uploads/syllabus
mkdir -p uploads/experiments
mkdir -p uploads/records
mkdir -p uploads/outputs
```

### 8. Run the Application
```bash
python run.py
```

You should see:
```
* Running on http://0.0.0.0:5000
* Debug mode: on
```

### 9. Test the API

**Test Health Check:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status": "healthy"}
```

## Testing with Sample Data

### 1. Register Users (for testing)

**Register a Teacher:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "college_id": "TCH001",
    "name": "Dr. Rajesh Kumar",
    "email": "rajesh@toch.edu",
    "password": "password123",
    "role": "teacher"
  }'
```

**Register a Student:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "college_id": "STU001",
    "name": "Arjun Menon",
    "email": "arjun@student.toch.edu",
    "password": "password123",
    "role": "student"
  }'
```

### 2. Login and Get Token

**Teacher Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "college_id": "TCH001",
    "password": "password123"
  }'
```

Save the token from the response!

### 3. Use Protected Routes

**Example: Get Teacher's Labs**
```bash
curl -X GET http://localhost:5000/api/teacher/labs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Common Issues and Solutions

### Issue 1: Database Connection Error
**Error:** `Can't connect to MySQL server`

**Solution:**
- Check if MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `app/config.py`
- Check if database exists: `SHOW DATABASES;`

### Issue 2: Module Import Errors
**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
- Activate virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`

### Issue 3: Port Already in Use
**Error:** `Address already in use`

**Solution:**
- Change port in `run.py`: `app.run(port=5001)`
- Or kill process using port 5000

### Issue 4: CORS Errors (when testing from frontend)
**Error:** `Access to fetch has been blocked by CORS policy`

**Solution:**
- Already configured in `app/__init__.py`
- If specific origin needed, update CORS config

### Issue 5: File Upload Errors
**Error:** `Permission denied` when uploading

**Solution:**
- Check folder permissions: `chmod -R 755 uploads/`
- Verify `MAX_CONTENT_LENGTH` in config

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login and get JWT token

**Request:**
```json
{
  "college_id": "STU001",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "college_id": "STU001",
    "name": "Arjun Menon",
    "role": "student"
  }
}
```

#### POST /api/auth/register
Register new user

**Request:**
```json
{
  "college_id": "STU004",
  "name": "New Student",
  "email": "new@student.toch.edu",
  "password": "password123",
  "role": "student"
}
```

### Teacher Endpoints

All teacher endpoints require:
- Header: `Authorization: Bearer <token>`
- Role: teacher

#### POST /api/teacher/syllabus/upload
Upload syllabus PDF

**Form Data:**
- `lab_id`: int
- `title`: string
- `file`: PDF file

#### POST /api/teacher/experiment/create
Create new experiment

**Form Data:**
- `lab_id`: int
- `title`: string
- `description`: string
- `experiment_date`: YYYY-MM-DD
- `file`: PDF file (optional)

#### GET /api/teacher/attendance/daily/<lab_id>
Get daily attendance

**Query Params:**
- `date`: YYYY-MM-DD (optional, defaults to today)

### Student Endpoints

All student endpoints require:
- Header: `Authorization: Bearer <token>`
- Role: student

#### POST /api/student/attendance/check-in
Check in for lab

**Request:**
```json
{
  "lab_id": 1,
  "experiment_id": 5
}
```

#### POST /api/student/submission/upload
Upload record

**Form Data:**
- `experiment_id`: int
- `file`: PDF/DOC file

## Production Deployment

### Using Gunicorn (Recommended)

1. Install gunicorn:
```bash
pip install gunicorn
```

2. Run with gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
```

Build and run:
```bash
docker build -t lab-management .
docker run -p 5000:5000 lab-management
```

## Next Steps

1. **Frontend Development**: Build React/Vue frontend
2. **AI Integration**: Implement OpenAI API for quiz generation
3. **Email Notifications**: Add email alerts for submissions
4. **File Download**: Implement file download endpoints
5. **Pagination**: Add pagination for large data sets
6. **Caching**: Implement Redis for performance
7. **Testing**: Write unit and integration tests