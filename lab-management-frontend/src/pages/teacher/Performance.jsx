import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../api/teacher';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Users,
  Search,
  Award,
  Target,
  BarChart3,
  Eye,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Performance = () => {
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [classPerformance, setClassPerformance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentDetailModalOpen, setStudentDetailModalOpen] = useState(false);
  const [studentPerformance, setStudentPerformance] = useState(null);

  useEffect(() => {
    teacherAPI.getManagedLabs()
      .then((d) => {
        setLabs(d.labs);
        if (d.labs.length > 0) setSelectedLab(d.labs[0].id);
      })
      .catch(() => toast.error('Failed to load labs'));
  }, []);

  useEffect(() => {
    if (selectedLab) loadClassPerformance();
  }, [selectedLab]);

  const loadClassPerformance = async () => {
    try {
      setLoading(true);
      const data = await teacherAPI.getClassPerformance(selectedLab);
      setClassPerformance(data);
    } catch (error) {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const viewStudentDetails = async (studentId) => {
    try {
      const data = await teacherAPI.getStudentPerformance(studentId, selectedLab);
      setStudentPerformance(data);
      setStudentDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load student details');
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading performance data..." />;
  }

  if (!classPerformance) {
    return null;
  }

  const chartData = [
    { name: 'Attendance', value: classPerformance.class_average.attendance_percentage },
    { name: 'Quiz', value: classPerformance.class_average.avg_quiz_score * 10 },
    { name: 'Viva', value: classPerformance.class_average.avg_viva_score * 10 },
    { name: 'Submissions', value: classPerformance.class_average.submission_rate },
  ];

  const allStudents = [
    ...classPerformance.top_performers,
    ...classPerformance.bottom_performers,
  ].filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.college_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Performance</h1>
              <p className="text-gray-600 mt-1">Monitor and analyze student progress</p>
            </div>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(Number(e.target.value))}
              className="input-field"
            >
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{classPerformance.total_students}</h3>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>

          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {classPerformance.class_average.overall_score.toFixed(0)}%
            </h3>
            <p className="text-sm text-gray-600">Class Average</p>
          </div>

          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {classPerformance.class_average.attendance_percentage.toFixed(0)}%
            </h3>
            <p className="text-sm text-gray-600">Avg Attendance</p>
          </div>

          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-3">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {classPerformance.class_average.avg_quiz_score.toFixed(1)}
            </h3>
            <p className="text-sm text-gray-600">Avg Quiz Score</p>
          </div>

          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mb-3">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {classPerformance.class_average.submission_rate.toFixed(0)}%
            </h3>
            <p className="text-sm text-gray-600">Submission Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Top Performers</h2>
            </div>
            <div className="space-y-3">
              {classPerformance.top_performers.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{student.student_name}</p>
                      <p className="text-xs text-gray-600">{student.college_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-600">{student.overall_score.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Students</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allStudents.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-semibold">
                              {student.student_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                          <div className="text-sm text-gray-500">{student.college_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16">
                          <span className={`text-lg font-bold ${
                            student.overall_score >= 75 ? 'text-green-600' :
                            student.overall_score >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {student.overall_score.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex-1 ml-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.overall_score >= 75 ? 'bg-green-500' :
                                student.overall_score >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${student.overall_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        student.attendance_percentage >= 75 ? 'badge-success' :
                        student.attendance_percentage >= 50 ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {student.attendance_percentage.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => viewStudentDetails(index + 1)}
                        className="text-primary-600 hover:text-primary-900 font-medium flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={studentDetailModalOpen}
        onClose={() => setStudentDetailModalOpen(false)}
        title="Student Performance Details"
        size="lg"
      >
        {studentPerformance && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl text-primary-700 font-semibold">
                    {studentPerformance.student.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{studentPerformance.student.name}</h3>
                <p className="text-gray-600">{studentPerformance.student.college_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Attendance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {studentPerformance.attendance_percentage.toFixed(0)}%
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Avg Quiz Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {studentPerformance.avg_quiz_score.toFixed(1)}/10
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Avg Viva Marks</p>
                <p className="text-2xl font-bold text-purple-600">
                  {studentPerformance.avg_viva_marks.toFixed(1)}/10
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Submission Rate</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {studentPerformance.submission_rate.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-center">
              <p className="text-sm text-primary-100 mb-2">Overall Performance Score</p>
              <p className="text-5xl font-bold">{studentPerformance.overall_score.toFixed(0)}%</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Experiments:</span>
                <span className="font-semibold">{studentPerformance.details.total_experiments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Records Submitted:</span>
                <span className="font-semibold">{studentPerformance.details.records_submitted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quizzes Attempted:</span>
                <span className="font-semibold">{studentPerformance.details.quizzes_attempted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sessions:</span>
                <span className="font-semibold">{studentPerformance.details.total_sessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attended:</span>
                <span className="font-semibold">{studentPerformance.details.total_attendance}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Performance;