import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  GraduationCap,
  LogOut,
  User,
  Menu,
  X,
  BookOpen,
  BarChart3,
  ClipboardList,
  FileText,
  CheckSquare,
  Zap,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={isTeacher ? '/teacher/dashboard' : '/student/dashboard'} className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LabTrack</h1>
                <p className="text-xs text-gray-500">Toc H Institute</p>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {isTeacher ? (
              <>
                <Link
                  to="/teacher/experiments"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Experiments</span>
                </Link>
                <Link
                  to="/teacher/attendance"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span className="font-medium">Attendance</span>
                </Link>
                <Link
                  to="/teacher/performance"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Performance</span>
                </Link>
                <Link
                  to="/teacher/submissions"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <CheckSquare className="w-5 h-5" />
                  <span className="font-medium">Submissions</span>
                </Link>
                <Link
                  to="/teacher/syllabus"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Syllabus</span>
                </Link>
                <Link
                  to="/teacher/quizzes"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Quizzes</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/student/labs"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">My Labs</span>
                </Link>
                <Link
                  to="/student/quizzes"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span className="font-medium">Quizzes</span>
                </Link>
                <Link
                  to="/student/performance"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Performance</span>
                </Link>
              </>
            )}

            <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.college_id}</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-full">
                <User className="w-5 h-5 text-primary-700" />
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="space-y-2">
              {isTeacher ? (
                <>
                  <Link
                    to="/teacher/experiments"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Experiments
                  </Link>
                  <Link
                    to="/teacher/attendance"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Attendance
                  </Link>
                  <Link
                    to="/teacher/performance"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Performance
                  </Link>
                  <Link
                    to="/teacher/submissions"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Submissions
                  </Link>
                  <Link
                    to="/teacher/syllabus"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Syllabus
                  </Link>
                  <Link
                    to="/teacher/quizzes"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Quizzes
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/student/labs"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Labs
                  </Link>
                  <Link
                    to="/student/quizzes"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Quizzes
                  </Link>
                  <Link
                    to="/student/performance"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Performance
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;