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
  const [selectedLab, setSelectedLab] = useState(1);
  const [classPerformance, setClassPerformance] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedLab]);

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
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, Dr. {user?.name}! 👋</h1>
              <p className="text-gray-600 mt-1">Here's what's happening in your labs today</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(Number(e.target.value))}
                className="input-field"
              >
                <option value={1}>Data Structures Lab</option>
                <option value={2}>Algorithm Lab</option>
                <option value={3}>Database Lab</option>
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

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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