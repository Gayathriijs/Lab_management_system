import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../api/teacher';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '../../utils/exportHelper';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [viewMode, setViewMode] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [absentees, setAbsentees] = useState([]);

  useEffect(() => {
    teacherAPI.getManagedLabs()
      .then((d) => {
        setLabs(d.labs);
        if (d.labs.length > 0) setSelectedLab(d.labs[0].id);
      })
      .catch(() => toast.error('Failed to load labs'));
  }, []);

  useEffect(() => {
    if (selectedLab) loadData();
  }, [selectedLab, viewMode, selectedDate, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (viewMode === 'daily') {
        const data = await teacherAPI.getDailyAttendance(selectedLab, selectedDate);
        setDailyData(data);
      } else {
        const data = await teacherAPI.getMonthlyAttendance(selectedLab, selectedMonth);
        setMonthlyData(data);
      }

      const absentData = await teacherAPI.getAbsentees(selectedLab, 3);
      setAbsentees(absentData.absentees);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (viewMode === 'daily') {
      if (!dailyData || !dailyData.attendance_list || dailyData.attendance_list.length === 0) {
        toast.error('No daily attendance data to export');
        return;
      }

      const exportRows = dailyData.attendance_list.map((record) => ({
        student_name: record.student_name,
        college_id: record.college_id,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time || '-',
        status: record.status || 'Present',
      }));

      exportToCSV(exportRows, `attendance_daily_${selectedDate}.csv`);
      toast.success('Daily attendance exported');
      return;
    }

    if (!monthlyData || !monthlyData.summary || monthlyData.summary.length === 0) {
      toast.error('No monthly attendance data to export');
      return;
    }

    const exportRows = monthlyData.summary.map((day) => {
      const attendanceRate = monthlyData.total_students
        ? ((day.present / monthlyData.total_students) * 100).toFixed(2)
        : '0.00';

      return {
        date: day.date,
        present: day.present,
        absent: day.absent,
        total_students: monthlyData.total_students,
        attendance_rate_percent: attendanceRate,
      };
    });

    exportToCSV(exportRows, `attendance_monthly_${selectedMonth}.csv`);
    toast.success('Monthly attendance exported');
  };

  if (loading) {
    return <Loading fullScreen message="Loading attendance data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
              <p className="text-gray-600 mt-1">Monitor student presence and identify patterns</p>
            </div>
            <div className="flex items-center space-x-3">
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

          <div className="mt-6 flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly View
              </button>
            </div>

            {viewMode === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field"
              />
            )}

            <button
              onClick={handleExport}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'daily' && dailyData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{dailyData.total_students}</h3>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>

            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{dailyData.present}</h3>
              <p className="text-sm text-gray-600">Present</p>
            </div>

            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-3">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{dailyData.absent}</h3>
              <p className="text-sm text-gray-600">Absent</p>
            </div>

            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-3">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {((dailyData.present / dailyData.total_students) * 100).toFixed(0)}%
              </h3>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === 'daily' && dailyData ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Attendance for {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyData.attendance_list.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.student_name}
                              </div>
                              <div className="text-sm text-gray-500">{record.college_id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.check_in_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.check_out_time || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="badge badge-success">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Present
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {dailyData.attendance_list.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No attendance records for this date</p>
                  </div>
                )}
              </div>
            ) : monthlyData ? (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Monthly Overview - {new Date(selectedMonth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </h2>

                <div className="space-y-3">
                  {monthlyData.summary.map((day, index) => {
                    const attendanceRate = (day.present / monthlyData.total_students) * 100;
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">{day.present}</span> present, 
                            <span className="font-semibold text-red-600 ml-1">{day.absent}</span> absent
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {monthlyData.summary.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No attendance data for this month</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="card h-fit">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Frequent Absentees</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Students with 3+ absences require attention
            </p>

            <div className="space-y-3">
              {absentees.map((student, index) => (
                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{student.student_name}</p>
                      <p className="text-sm text-gray-600">{student.college_id}</p>
                    </div>
                    <span className="badge badge-danger">
                      {student.absent} absent
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Attendance</span>
                    <span className="font-semibold text-red-600">
                      {student.attendance_percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${student.attendance_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {absentees.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All students have good attendance!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;