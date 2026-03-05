import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentAPI } from '../../api/student';
import Loading from '../../components/common/Loading';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Award,
  FileText,
  Target,
  AlertCircle,
} from 'lucide-react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [upcomingExperiments, setUpcomingExperiments] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      loadLabData();
    }
  }, [selectedLab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const labsData = await studentAPI.getEnrolledLabs();
      setLabs(labsData.labs);
      
      if (labsData.labs.length > 0) {
        setSelectedLab(labsData.labs[0].id);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLabData = async () => {
    try {
      const [perfData, expData] = await Promise.all([
        studentAPI.getMyPerformance(selectedLab),
        studentAPI.getExperiments(selectedLab),
      ]);

      setPerformance(perfData);
      
      const today = new Date();
      const upcoming = expData.experiments
        .filter(exp => new Date(exp.experiment_date) >= today)
        .slice(0, 3);
      setUpcomingExperiments(upcoming);
    } catch (error) {
      console.error('Error loading lab data:', error);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name}! 🎓</h1>
              <p className="text-primary-100 mt-1">Keep up the great work in your labs</p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-sm text-primary-100">Student ID</p>
                <p className="text-2xl font-bold">{user?.college_id}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <select
              value={selectedLab || ''}
              onChange={(e) => setSelectedLab(Number(e.target.value))}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
            >
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} - {lab.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {performance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <div className="card text-center">
              <div className="w-32 h-32 mx-auto mb-4">
                <CircularProgressbar
                  value={performance.attendance_percentage}
                  text={`${performance.attendance_percentage.toFixed(0)}%`}
                  styles={{
                    path: { stroke: '#0ea5e9' },
                    text: { fill: '#0ea5e9', fontSize: '16px', fontWeight: 'bold' },
                    trail: { stroke: '#e0f2fe' },
                  }}
                />
              </div>
              <h3 className="font-semibold text-gray-900">Attendance</h3>
              <p className="text-sm text-gray-500 mt-1">
                {performance.details.total_attendance}/{performance.details.total_sessions} sessions
              </p>
            </div>

            <div className="card text-center">
              <div className="w-32 h-32 mx-auto mb-4">
                <CircularProgressbar
                  value={performance.avg_quiz_score * 10}
                  text={`${performance.avg_quiz_score.toFixed(1)}/10`}
                  styles={{
                    path: { stroke: '#10b981' },
                    text: { fill: '#10b981', fontSize: '16px', fontWeight: 'bold' },
                    trail: { stroke: '#d1fae5' },
                  }}
                />
              </div>
              <h3 className="font-semibold text-gray-900">Quiz Score</h3>
              <p className="text-sm text-gray-500 mt-1">
                {performance.details.quizzes_attempted} quizzes attempted
              </p>
            </div>

            <div className="card text-center">
              <div className="w-32 h-32 mx-auto mb-4">
                <CircularProgressbar
                  value={performance.avg_viva_marks * 10}
                  text={`${performance.avg_viva_marks.toFixed(1)}/10`}
                  styles={{
                    path: { stroke: '#8b5cf6' },
                    text: { fill: '#8b5cf6', fontSize: '16px', fontWeight: 'bold' },
                    trail: { stroke: '#ede9fe' },
                  }}
                />
              </div>
              <h3 className="font-semibold text-gray-900">Viva Marks</h3>
              <p className="text-sm text-gray-500 mt-1">
                {performance.details.total_vivas} vivas completed
              </p>
            </div>

            <div className="card text-center">
              <div className="w-32 h-32 mx-auto mb-4">
                <CircularProgressbar
                  value={performance.submission_rate}
                  text={`${performance.submission_rate.toFixed(0)}%`}
                  styles={{
                    path: { stroke: '#f59e0b' },
                    text: { fill: '#f59e0b', fontSize: '16px', fontWeight: 'bold' },
                    trail: { stroke: '#fef3c7' },
                  }}
                />
              </div>
              <h3 className="font-semibold text-gray-900">Submissions</h3>
              <p className="text-sm text-gray-500 mt-1">
                {performance.details.records_submitted}/{performance.details.total_experiments} submitted
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {performance && (
            <div className="card lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Overall Performance</h2>
                <Target className="w-5 h-5 text-primary-600" />
              </div>
              
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white mb-3">
                  <span className="text-3xl font-bold">{performance.overall_score.toFixed(0)}</span>
                </div>
                <p className="text-sm text-gray-600">Out of 100</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Attendance Weight</span>
                  <span className="font-semibold">30%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Viva Weight</span>
                  <span className="font-semibold">25%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Quiz Weight</span>
                  <span className="font-semibold">25%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Submission Weight</span>
                  <span className="font-semibold">20%</span>
                </div>
              </div>

              {performance.overall_score < 75 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">
                      Your performance could be improved. Focus on attendance and submissions!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Experiments</h2>
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>

            {upcomingExperiments.length > 0 ? (
              <div className="space-y-3">
                {upcomingExperiments.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
                        <span className="text-lg font-bold text-primary-600">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(exp.experiment_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {exp.record_submitted ? (
                        <span className="badge-success">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Submitted
                        </span>
                      ) : (
                        <span className="badge-warning">
                          <Clock className="w-4 h-4 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming experiments</p>
              </div>
            )}

            <Link
              to="/student/labs"
              className="block mt-4 text-center text-primary-600 hover:text-primary-700 font-medium"
            >
              View All Experiments →
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/student/labs" className="card hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Experiments</h3>
                <p className="text-sm text-gray-500">Browse lab experiments</p>
              </div>
            </div>
          </Link>

          <Link to="/student/quizzes" className="card hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Take Quizzes</h3>
                <p className="text-sm text-gray-500">Test your knowledge</p>
              </div>
            </div>
          </Link>

          <Link to="/student/performance" className="card hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Track Progress</h3>
                <p className="text-sm text-gray-500">View detailed analytics</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;