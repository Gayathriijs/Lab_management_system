import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Layout Components
import Navbar from './components/common/Navbar';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import Experiments from './pages/teacher/Experiments';
import Attendance from './pages/teacher/Attendance';
import Performance from './pages/teacher/Performance';
import Submissions from './pages/teacher/Submissions';
import TeacherSyllabus from './pages/teacher/Syllabus';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyLabs from './pages/student/MyLabs';
import Quizzes from './pages/student/Quizzes';
import MyPerformance from './pages/student/MyPerformance';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

// Layout wrapper with Navbar
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Teacher Routes */}
              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Layout>
                      <TeacherDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/experiments"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Layout>
                      <Experiments />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/attendance"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Layout>
                      <Attendance />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/performance"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Layout>
                      <Performance />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/submissions"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Layout>
                      <Submissions />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/syllabus"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Layout>
                      <TeacherSyllabus />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/quizzes"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <Layout>
                      <TeacherQuizzes />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute requiredRole="student">
                    <Layout>
                      <StudentDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/labs"
                element={
                  <ProtectedRoute requiredRole="student">
                    <Layout>
                      <MyLabs />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/quizzes"
                element={
                  <ProtectedRoute requiredRole="student">
                    <Layout>
                      <Quizzes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/performance"
                element={
                  <ProtectedRoute requiredRole="student">
                    <Layout>
                      <MyPerformance />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* 404 Page */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-xl text-gray-600 mb-8">Page not found</p>
                      <a href="/" className="btn-primary">
                        Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#363636',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;