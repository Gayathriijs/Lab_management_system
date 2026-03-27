import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { teacherAPI } from '../../api/teacher';
import Loading from '../../components/common/Loading';
import {
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  Award,
  UserPlus,
  UserMinus,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
  <div className="card hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
          trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <TrendingUp className="w-3 h-3" />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  </div>
);

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExperiments: 0,
    pendingSubmissions: 0,
    averageAttendance: 0,
  });
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [classPerformance, setClassPerformance] = useState(null);

  // Enrollment panel state
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [unenrolledStudents, setUnenrolledStudents] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [unenrollSearch, setUnenrollSearch] = useState('');

  useEffect(() => {
    loadLabs();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      loadDashboardData();
      if (showEnrollment) loadEnrollmentData();
    }
  }, [selectedLab]);

  const loadLabs = async () => {
    try {
      const data = await teacherAPI.getManagedLabs();
      setLabs(data.labs);
      if (data.labs.length > 0) setSelectedLab(data.labs[0].id);
    } catch (error) {
      console.error('Error loading labs:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const perfData = await teacherAPI.getClassPerformance(selectedLab);
      setClassPerformance(perfData);

      const expData = await teacherAPI.getExperiments(selectedLab);
      const subData = await teacherAPI.getPendingSubmissions(selectedLab);

      setStats({
        totalStudents: perfData.total_students,
        totalExperiments: expData.experiments.length,
        pendingSubmissions: subData.pending_submissions.length,
        averageAttendance: perfData.class_average.attendance_percentage,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentData = async () => {
    try {
      setEnrollmentLoading(true);
      const data = await teacherAPI.getLabStudents(selectedLab);
      setEnrolledStudents(data.enrolled);
      setUnenrolledStudents(data.unenrolled);
    } catch (error) {
      console.error('Error loading enrollment data:', error);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleToggleEnrollment = () => {
    const next = !showEnrollment;
    setShowEnrollment(next);
    if (next) loadEnrollmentData();
  };

  const handleEnroll = async (studentId) => {
    try {
      await teacherAPI.enrollStudent(selectedLab, studentId);
      await loadEnrollmentData();
      await loadDashboardData();
    } catch (error) {
      console.error('Enroll error:', error);
    }
  };

  const handleUnenroll = async (studentId) => {
    try {
      await teacherAPI.unenrollStudent(selectedLab, studentId);
      await loadEnrollmentData();
      await loadDashboardData();
    } catch (error) {
      console.error('Unenroll error:', error);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading dashboard..." />;
  }

  const performanceData = classPerformance?.top_performers.slice(0, 5).map(p => ({
    name: p.student_name.split(' ')[0],
    score: p.overall_score,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back,{user?.name}! 👋</h1>
              <p className="text-gray-600 mt-1">Here's what's happening in your labs today</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedLab || ''}
                onChange={(e) => setSelectedLab(Number(e.target.value))}
                className="input-field"
              >
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} ({lab.student_count} students)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <StatCard
            icon={Users}
            title="Total Students"
            value={stats.totalStudents}
            subtitle="Enrolled in lab"
            color="blue"
          />
          <StatCard
            icon={BookOpen}
            title="Experiments"
            value={stats.totalExperiments}
            subtitle="Created this semester"
            color="green"
          />
          <StatCard
            icon={Clock}
            title="Pending Reviews"
            value={stats.pendingSubmissions}
            subtitle="Submissions awaiting"
            color="yellow"
          />
          <StatCard
            icon={CheckCircle}
            title="Avg Attendance"
            value={`${stats.averageAttendance.toFixed(1)}%`}
            subtitle="Class average"
            color="purple"
            trend={5.2}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Performers</h2>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Class Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Attendance</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {classPerformance?.class_average.attendance_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Submissions</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {classPerformance?.class_average.submission_rate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Avg Quiz Score</span>
                </div>
                <span className="text-lg font-bold text-purple-600">
                  {classPerformance?.class_average.avg_quiz_score.toFixed(1)}/10
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Overall Score</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">
                  {classPerformance?.class_average.overall_score.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {classPerformance?.bottom_performers.length > 0 && (
          <div className="mt-6 card bg-yellow-50 border-yellow-200 animate-slide-in-right">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Students Needing Attention</h3>
                <p className="text-sm text-gray-600 mb-3">
                  These students have low performance scores and may need additional support
                </p>
                <div className="flex flex-wrap gap-2">
                  {classPerformance.bottom_performers.map((student, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-yellow-200">
                      <span className="font-medium text-gray-900">{student.student_name}</span>
                      <span className="text-sm text-gray-500">({student.overall_score.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ENROLLMENT MANAGEMENT PANEL ===== */}
        <div className="mt-8 card">
          <button
            onClick={handleToggleEnrollment}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-900">Manage Student Enrollment</h2>
                <p className="text-sm text-gray-500">
                  {enrolledStudents.length > 0 || showEnrollment
                    ? `${enrolledStudents.length} enrolled · ${unenrolledStudents.length} available`
                    : 'Click to enroll or remove students'}
                </p>
              </div>
            </div>
            {showEnrollment ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showEnrollment && (
            <div className="mt-6">
              {enrollmentLoading ? (
                <div className="text-center py-8 text-gray-500">Loading students...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Enrolled Students */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Enrolled ({enrolledStudents.length})</span>
                      </h3>
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search enrolled..."
                        value={unenrollSearch}
                        onChange={(e) => setUnenrollSearch(e.target.value)}
                        className="input-field pl-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {enrolledStudents
                        .filter((s) =>
                          s.name.toLowerCase().includes(unenrollSearch.toLowerCase()) ||
                          s.college_id.toLowerCase().includes(unenrollSearch.toLowerCase())
                        )
                        .map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.college_id}</p>
                            </div>
                            <button
                              onClick={() => handleUnenroll(student.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        ))}
                      {enrolledStudents.length === 0 && (
                        <p className="text-center text-gray-400 py-6 text-sm">No students enrolled yet</p>
                      )}
                    </div>
                  </div>

                  {/* Unenrolled Students */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                        <UserPlus className="w-4 h-4 text-blue-500" />
                        <span>Available to Enroll ({unenrolledStudents.length})</span>
                      </h3>
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={enrollSearch}
                        onChange={(e) => setEnrollSearch(e.target.value)}
                        className="input-field pl-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {unenrolledStudents
                        .filter((s) =>
                          s.name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
                          s.college_id.toLowerCase().includes(enrollSearch.toLowerCase())
                        )
                        .map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.college_id}</p>
                            </div>
                            <button
                              onClick={() => handleEnroll(student.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Enroll</span>
                            </button>
                          </div>
                        ))}
                      {unenrolledStudents.length === 0 && (
                        <p className="text-center text-gray-400 py-6 text-sm">All students are enrolled</p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="card hover:shadow-md transition-shadow duration-200 text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Experiment</h3>
                <p className="text-sm text-gray-500">Add new lab experiment</p>
              </div>
            </div>
          </button>
          
          <button className="card hover:shadow-md transition-shadow duration-200 text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Review Submissions</h3>
                <p className="text-sm text-gray-500">{stats.pendingSubmissions} pending</p>
              </div>
            </div>
          </button>
          
          <button className="card hover:shadow-md transition-shadow duration-200 text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Attendance</h3>
                <p className="text-sm text-gray-500">Track student presence</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;