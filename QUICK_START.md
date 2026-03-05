# Quick Start Guide - Lab Management System

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed
- MySQL/MariaDB running
- Git (optional)

---

## Backend Setup

### 1. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE lab_management;

# Import schema
USE lab_management;
SOURCE backend/schema.sql;

# Exit MySQL
exit;
```

### 2. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment
Create `backend/.env`:
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-this
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your-mysql-password
DATABASE_NAME=lab_management
```

### 4. Start Backend Server
```bash
cd backend
python run.py
```
Backend will run on: **http://localhost:5000**

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd lab-management-frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Frontend will run on: **http://localhost:3000**

---

## Testing the Application

### Demo Credentials

**Teacher Account:**
- College ID: `TCH001`
- Password: `password123`

**Student Account:**
- College ID: `STU001`
- Password: `password123`

### Test Flow

1. **Login Test**
   - Navigate to http://localhost:3000/login
   - Enter demo credentials
   - Verify redirect to dashboard
   - Check browser DevTools → Network tab for API calls
   - Check localStorage for token

2. **Student Features**
   - View enrolled labs
   - Check experiments list
   - View attendance records
   - Take available quizzes
   - Check performance metrics

3. **Teacher Features**
   - Create new experiment
   - Track daily/monthly attendance
   - Evaluate student submissions
   - Generate AI quizzes
   - View class performance analytics

---

## API Endpoints Quick Reference

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- GET `/api/auth/verify` - Verify token

### Student
- GET `/api/student/labs` - Get enrolled labs
- GET `/api/student/experiments/:lab_id` - Get experiments
- POST `/api/student/submission/upload` - Upload record
- POST `/api/student/quiz/start/:quiz_id` - Start quiz
- GET `/api/student/performance/:lab_id` - Get performance

### Teacher
- POST `/api/teacher/experiment/create` - Create experiment
- GET `/api/teacher/attendance/daily/:lab_id` - Daily attendance
- POST `/api/teacher/quiz/generate/:experiment_id` - Generate quiz
- GET `/api/teacher/performance/class/:lab_id` - Class performance

**Full API documentation:** See [API_INTEGRATION.md](API_INTEGRATION.md)

---

## Project Structure

```
Lab_management_system/
├── backend/
│   ├── app/
│   │   ├── routes/           # API routes
│   │   │   ├── auth_routes.py
│   │   │   ├── student_routes.py
│   │   │   └── teacher_routes.py
│   │   ├── models.py         # Database models
│   │   ├── auth.py           # JWT authentication
│   │   └── config.py         # Configuration
│   ├── uploads/              # File uploads
│   ├── requirements.txt
│   ├── schema.sql
│   └── run.py
│
└── lab-management-frontend/
    ├── src/
    │   ├── api/              # API integration
    │   │   ├── axios.js      # Axios config
    │   │   ├── auth.js       # Auth endpoints
    │   │   ├── student.js    # Student endpoints
    │   │   └── teacher.js    # Teacher endpoints
    │   ├── pages/            # React pages
    │   │   ├── auth/
    │   │   ├── student/
    │   │   └── teacher/
    │   ├── components/       # Reusable components
    │   ├── context/          # React context
    │   │   └── AuthContext.jsx
    │   └── App.jsx
    ├── vite.config.js        # Vite config with proxy
    └── package.json
```

---

## Development Tips

### Hot Reload
- Both frontend and backend support hot reload
- Changes auto-refresh during development
- Backend: Uses Flask debug mode
- Frontend: Uses Vite HMR

### Debugging API Calls
```javascript
// In browser console
localStorage.getItem('token')  // Check JWT token
localStorage.getItem('user')   // Check user data

// API call example
fetch('/api/student/labs', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)
```

### Backend Logs
- Check terminal for request logs
- JWT errors logged with details
- Database query errors shown

### Network Tab
- Open Chrome DevTools → Network
- Filter by XHR/Fetch
- Check request/response for each API call

---

## Common Issues

### Backend not starting
```bash
# Check MySQL is running
mysql -u root -p

# Verify Python dependencies
pip list | grep Flask

# Check port 5000 is free
netstat -an | findstr 5000  # Windows
lsof -i :5000               # macOS/Linux
```

### Frontend API errors
```bash
# Verify backend is running
curl http://localhost:5000/api/auth/verify

# Check Vite proxy in vite.config.js
# Restart dev server
npm run dev
```

### CORS issues
- Vite dev proxy handles CORS automatically
- Backend has flask-cors enabled
- No additional configuration needed

### Authentication issues
```javascript
// Clear localStorage and try again
localStorage.clear()

// Check token in DevTools → Application → Local Storage
```

---

## Building for Production

### Frontend
```bash
cd lab-management-frontend
npm run build
# Output in dist/ folder
```

### Backend
```bash
cd backend
# Set environment to production
echo "FLASK_ENV=production" >> .env

# Use production server (gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

---

## Features Implemented

### ✅ Authentication
- JWT-based login/logout
- Role-based access (teacher/student)
- Password hashing with bcrypt
- Token refresh on page reload

### ✅ Student Features
- View enrolled labs and experiments
- Upload lab records and outputs
- Check in/out attendance
- Take AI-generated quizzes
- View performance analytics
- Calendar view of lab sessions

### ✅ Teacher Features
- Create and manage experiments
- Track student attendance (daily/monthly)
- Evaluate submissions with marks
- Generate AI quizzes from documents
- Deploy quizzes to students
- View class performance analytics
- Identify frequent absentees
- Add viva scores

### ✅ File Management
- PDF syllabus uploads
- Experiment document uploads
- Student record submissions
- Output file submissions
- Secure file storage

---

## Tech Stack

### Backend
- **Framework:** Flask 2.3.0
- **Database:** MySQL with mysql-connector-python
- **Auth:** PyJWT for token generation
- **Security:** bcrypt for password hashing
- **CORS:** flask-cors

### Frontend
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.3.1
- **Router:** React Router DOM 7.13.1
- **State:** React Query (TanStack Query)
- **HTTP:** Axios 1.13.6
- **Styling:** Tailwind CSS 4.2.1
- **Icons:** Lucide React
- **Charts:** Recharts
- **Notifications:** React Hot Toast

---

## Support

For issues or questions:
1. Check [API_INTEGRATION.md](API_INTEGRATION.md) for detailed API docs
2. Review browser console for frontend errors
3. Check backend terminal for server logs
4. Verify database schema is properly imported

---

## Next Steps

1. **Test all features** with demo accounts
2. **Create additional users** via registration
3. **Upload syllabus** files as teacher
4. **Create experiments** with due dates
5. **Take quizzes** as student
6. **View analytics** on dashboards

---

**Status:** ✅ All backend endpoints connected to frontend
**Last Updated:** March 4, 2026
