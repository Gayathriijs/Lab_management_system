import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentAPI } from '../../api/student';
import toast from 'react-hot-toast';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  TrendingUp,
  ClipboardList,
  Award,
  FileText,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Minus,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const scoreColor = (val) => {
  if (val >= 75) return '#10b981'; // green
  if (val >= 50) return '#f59e0b'; // amber
  return '#ef4444';                // red
};

const trailColor = (val) => {
  if (val >= 75) return '#d1fae5';
  if (val >= 50) return '#fef3c7';
  return '#fee2e2';
};

const MetricCard = ({ label, value, max = 100, unit = '%', icon: Icon, color }) => {
  const pct = max === 100 ? value : (value / max) * 100;
  const c = color || scoreColor(pct);
  const t = trailColor(pct);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
      <div className="w-28 h-28 mb-4">
        <CircularProgressbar
          value={pct}
          text={`${value}${unit}`}
          styles={buildStyles({
            pathColor: c,
            textColor: c,
            trailColor: t,
            textSize: '16px',
          })}
        />
      </div>
      <div className="flex items-center gap-1.5 text-gray-700 font-semibold text-sm">
        <Icon className="w-4 h-4" style={{ color: c }} />
        {label}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Calendar
// ────────────────────────────────────────────────────────────
const CalendarView = ({ labId }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    if (!labId) return;
    setLoading(true);
    studentAPI
      .getLabCalendar(labId, monthStr)
      .then((d) => setSessions(d.sessions || []))
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [labId, monthStr]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const MONTH_NAMES = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  // Build a date→session map
  const sessionMap = {};
  sessions.forEach((s) => { sessionMap[s.date] = s; });

  // Calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-gray-900">{MONTH_NAMES[month - 1]} {year}</h3>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="p-4">
          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const session = sessionMap[dateStr];
              return (
                <div
                  key={dateStr}
                  title={session ? session.experiment_title : ''}
                  className={`relative flex flex-col items-center justify-center rounded-lg py-2 min-h-[48px] text-sm
                    ${session
                      ? session.attended
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <span className={`font-medium ${session ? (session.attended ? 'text-green-800' : 'text-red-800') : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {session && (
                    <div className="flex gap-0.5 mt-1">
                      <span title="Record" className={`w-1.5 h-1.5 rounded-full ${session.record_submitted ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <span title="Quiz" className={`w-1.5 h-1.5 rounded-full ${session.quiz_attempted ? 'bg-purple-500' : 'bg-gray-300'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block" /> Attended</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" /> Absent</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Record submitted</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" /> Quiz attempted</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
const MyPerformance = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // Load labs
  useEffect(() => {
    studentAPI
      .getEnrolledLabs()
      .then((d) => {
        setLabs(d.labs);
        if (d.labs.length > 0) setSelectedLab(d.labs[0].id);
      })
      .catch(() => toast.error('Failed to load labs'))
      .finally(() => setLoadingLabs(false));
  }, []);

  // Load performance when lab changes
  useEffect(() => {
    if (!selectedLab) return;
    setLoadingPerf(true);
    setPerformance(null);
    studentAPI
      .getMyPerformance(selectedLab)
      .then((d) => setPerformance(d))
      .catch(() => toast.error('Failed to load performance'))
      .finally(() => setLoadingPerf(false));
  }, [selectedLab]);

  if (loadingLabs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (labs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No labs enrolled</h2>
          <p className="text-gray-400 mt-1">Enroll in a lab to see your performance.</p>
        </div>
      </div>
    );
  }

  const currentLab = labs.find((l) => l.id === selectedLab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Performance</h1>
              <p className="text-primary-100 mt-1">{user?.name} · {user?.college_id}</p>
            </div>
            {performance && (
              <div className="bg-white/20 rounded-2xl px-5 py-3 text-center">
                <p className="text-xs text-primary-100 mb-1">Overall Score</p>
                <p className="text-4xl font-extrabold">{performance.overall_score?.toFixed(1)}</p>
                <p className="text-xs text-primary-100 mt-0.5">out of 100</p>
              </div>
            )}
          </div>

          {/* Lab selector */}
          <div className="mt-5 flex flex-wrap gap-2">
            {labs.map((lab) => (
              <button
                key={lab.id}
                onClick={() => setSelectedLab(lab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLab === lab.id
                    ? 'bg-white text-primary-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {lab.name}
                <span className="ml-1 text-xs opacity-70">({lab.code})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loadingPerf ? (
          <div className="text-center py-16 text-gray-400">Loading performance data...</div>
        ) : performance ? (
          <>
            {/* ── Metric Cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard
                  label="Attendance"
                  value={performance.attendance_percentage?.toFixed(1)}
                  icon={ClipboardList}
                />
                <MetricCard
                  label="Quiz Score"
                  value={performance.avg_quiz_score?.toFixed(1)}
                  max={10}
                  unit="/10"
                  icon={Award}
                />
                <MetricCard
                  label="Viva Marks"
                  value={performance.avg_viva_marks?.toFixed(1)}
                  max={10}
                  unit="/10"
                  icon={BookOpen}
                />
                <MetricCard
                  label="Submission Rate"
                  value={performance.submission_rate?.toFixed(1)}
                  icon={FileText}
                />
                <MetricCard
                  label="Overall"
                  value={performance.overall_score?.toFixed(1)}
                  icon={TrendingUp}
                  color={scoreColor(performance.overall_score)}
                />
              </div>
            </div>

            {/* ── Stats breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Details table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Activity Summary</h3>
                  {currentLab && (
                    <p className="text-sm text-gray-400">{currentLab.name} ({currentLab.code})</p>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { label: 'Sessions Attended',     value: `${performance.details?.total_attendance} / ${performance.details?.total_sessions}`,     icon: ClipboardList, good: performance.attendance_percentage >= 75 },
                    { label: 'Records Submitted',     value: `${performance.details?.records_submitted} / ${performance.details?.total_experiments}`,  icon: FileText,      good: performance.submission_rate >= 75 },
                    { label: 'Quizzes Attempted',     value: `${performance.details?.quizzes_attempted}`,                                              icon: Award,         good: performance.details?.quizzes_attempted > 0 },
                    { label: 'Viva Evaluations',      value: `${performance.details?.total_vivas}`,                                                    icon: BookOpen,      good: performance.details?.total_vivas > 0 },
                    { label: 'Avg Submission Marks',  value: `${performance.avg_submission_marks?.toFixed(2)}`,                                        icon: TrendingUp,    good: performance.avg_submission_marks > 0 },
                  ].map(({ label, value, icon: Icon, good }) => (
                    <div key={label} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon className="w-4 h-4 text-gray-400" />
                        {label}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{value}</span>
                        {good
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <AlertCircle className="w-4 h-4 text-amber-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weightage info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Score Weightage</h3>
                  <p className="text-sm text-gray-400">How your overall score is calculated</p>
                </div>
                <div className="px-6 py-4 space-y-4">
                  {[
                    { label: 'Attendance',     weight: 30, value: performance.attendance_percentage, color: 'bg-sky-500' },
                    { label: 'Viva Marks',     weight: 25, value: (performance.avg_viva_marks / 10) * 100, color: 'bg-violet-500' },
                    { label: 'Quiz Score',     weight: 25, value: (performance.avg_quiz_score / 10) * 100, color: 'bg-emerald-500' },
                    { label: 'Submission Rate',weight: 20, value: performance.submission_rate, color: 'bg-amber-500' },
                  ].map(({ label, weight, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="text-gray-500 font-medium">{weight}% weight · {value?.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${Math.min(value || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall bar */}
                <div className="px-6 pb-5 pt-2 border-t border-gray-100 mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-800">Overall Score</span>
                    <span className="font-bold" style={{ color: scoreColor(performance.overall_score) }}>
                      {performance.overall_score?.toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(performance.overall_score || 0, 100)}%`,
                        background: scoreColor(performance.overall_score),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Low attendance warning */}
            {performance.attendance_percentage < 75 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 px-5 py-4 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <strong>Low Attendance Warning</strong> — Your attendance is{' '}
                  {performance.attendance_percentage?.toFixed(1)}%, which is below the required 75%.
                  You need to attend at least{' '}
                  {Math.max(
                    0,
                    Math.ceil(0.75 * performance.details?.total_sessions) -
                      performance.details?.total_attendance
                  )}{' '}
                  more session(s) to reach the minimum threshold.
                </div>
              </div>
            )}

            {/* ── Calendar */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Calendar</h2>
              <CalendarView labId={selectedLab} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default MyPerformance;
