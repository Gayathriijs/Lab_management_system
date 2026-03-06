import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentAPI } from '../../api/student';
import toast from 'react-hot-toast';
import {
  BookOpen,
  FlaskConical,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  LogIn,
  LogOut,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  AlertCircle,
  Calendar,
  Award,
  Download,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Small helpers
// ────────────────────────────────────────────────────────────
const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    green:  'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red:    'bg-red-100 text-red-800',
    blue:   'bg-blue-100 text-blue-800',
    gray:   'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

const StatusBadge = ({ submitted, status }) => {
  if (!submitted) return <Badge color="gray">Not submitted</Badge>;
  if (status === 'accepted') return <Badge color="green">Accepted</Badge>;
  if (status === 'rejected') return <Badge color="red">Rejected</Badge>;
  return <Badge color="yellow">Pending review</Badge>;
};

// ────────────────────────────────────────────────────────────
// Upload Modal
// ────────────────────────────────────────────────────────────
const UploadModal = ({ experiment, type, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'record' && !file) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('experiment_id', experiment.id);
      if (file) formData.append('file', file);
      if (type === 'output') formData.append('notes', notes);

      if (type === 'record') {
        await studentAPI.uploadRecord(formData);
        toast.success('Record submitted successfully');
      } else {
        await studentAPI.uploadOutput(formData);
        toast.success('Output submitted successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {type === 'record' ? 'Upload Lab Record' : 'Submit Output'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{experiment.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {type === 'record' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Record File <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                {file ? (
                  <p className="text-sm font-medium text-primary-700">{file.name}</p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload PDF/DOC</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your output..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Output File (optional)</label>
                <div
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  {file ? (
                    <p className="text-sm font-medium text-primary-700">{file.name}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Click to attach a file (optional)</p>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Experiment Detail Modal
// ────────────────────────────────────────────────────────────
const ExperimentDetailModal = ({ experimentId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI
      .getExperimentDetails(experimentId)
      .then((d) => setDetail(d))
      .catch(() => toast.error('Failed to load experiment details'))
      .finally(() => setLoading(false));
  }, [experimentId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Experiment Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : detail ? (
          <div className="p-6 space-y-5">
            {/* Experiment info */}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{detail.experiment?.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{detail.experiment?.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {detail.experiment?.experiment_date}
              </div>
              {detail.experiment?.file_path && (
                <a
                  href={`http://localhost:5000${detail.experiment.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 hover:underline"
                >
                  <Download className="w-4 h-4" /> Download Experiment File
                </a>
              )}
            </div>

            {/* Submission */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Record Submission
              </h4>
              {detail.submission_status ? (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge submitted={true} status={detail.submission_status.status} />
                  </div>
                  {detail.submission_status.marks != null && (
                    <p className="text-gray-600">Marks: <span className="font-medium">{detail.submission_status.marks}</span></p>
                  )}
                  {detail.submission_status.remarks && (
                    <p className="text-gray-600">Remarks: {detail.submission_status.remarks}</p>
                  )}
                  <p className="text-gray-400 text-xs">Submitted: {detail.submission_status.submitted_at}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No record submitted yet</p>
              )}
            </div>

            {/* Quiz */}
            {detail.quiz_info && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Quiz
                </h4>
                <p className="text-sm font-medium text-gray-800">{detail.quiz_info.title}</p>
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  <span>Duration: {detail.quiz_info.duration_minutes} min</span>
                  <span>Total marks: {detail.quiz_info.total_marks}</span>
                </div>
                {detail.quiz_info.score != null ? (
                  <p className="text-sm mt-2 text-green-700 font-medium">
                    Score: {detail.quiz_info.score}/{detail.quiz_info.total_marks}
                  </p>
                ) : (
                  <Badge color="yellow" className="mt-2">Not attempted</Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-red-500">Failed to load details</div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Tabs
// ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'experiments', label: 'Experiments', icon: FlaskConical },
  { id: 'attendance',  label: 'Attendance',  icon: ClipboardList },
  { id: 'syllabus',    label: 'Syllabus',    icon: BookOpen },
  { id: 'quizzes',     label: 'Quizzes',     icon: Award },
];

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
const MyLabs = () => {
  const { user } = useAuth();

  // Labs
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [loadingLabs, setLoadingLabs] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState('experiments');

  // Experiments
  const [experiments, setExperiments] = useState([]);
  const [loadingExp, setLoadingExp] = useState(false);

  // Attendance
  const [attendance, setAttendance] = useState(null);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null); // {id, checkedOut}

  // Syllabus
  const [syllabus, setSyllabus] = useState([]);
  const [loadingSyl, setLoadingSyl] = useState(false);

  // Quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Modals
  const [uploadModal, setUploadModal] = useState(null); // { experiment, type }
  const [detailModal, setDetailModal] = useState(null); // experimentId

  // ── Load labs on mount
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

  // ── Load tab data when lab/tab changes
  // loadAttendance is always called (not just on attendance tab) so that
  // todayAttendance state (check-in/out button) is always in sync on every
  // page load, refresh, or lab switch.
  useEffect(() => {
    if (!selectedLab) return;
    loadAttendance(); // always keep today's check-in status up-to-date
    if (activeTab === 'experiments') loadExperiments();
    if (activeTab === 'syllabus')    loadSyllabus();
    if (activeTab === 'quizzes')     loadQuizzes();
  }, [selectedLab, activeTab]);

  const loadExperiments = async () => {
    setLoadingExp(true);
    try {
      const d = await studentAPI.getExperiments(selectedLab);
      setExperiments(d.experiments);
    } catch {
      toast.error('Failed to load experiments');
    } finally {
      setLoadingExp(false);
    }
  };

  const loadAttendance = async () => {
    setLoadingAtt(true);
    try {
      const d = await studentAPI.getMyAttendance(selectedLab);
      setAttendance(d);
      // Detect today's check-in/out state:
      // - null       → no check-in yet      → show Check In button
      // - checkedOut:false → checked in, no checkout → show Check Out button
      // - checkedOut:true  → fully checked out       → show "Attendance recorded"
      const today = new Date().toISOString().slice(0, 10);
      const todayRecord = d.records?.find(
        (r) => r.check_in_time?.startsWith(today)
      );
      if (todayRecord) {
        setTodayAttendance({ id: todayRecord.id, checkedOut: !!todayRecord.check_out_time });
      } else {
        setTodayAttendance(null);
      }
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoadingAtt(false);
    }
  };

  const loadSyllabus = async () => {
    setLoadingSyl(true);
    try {
      const d = await studentAPI.getSyllabus(selectedLab);
      setSyllabus(d.syllabus);
    } catch {
      toast.error('Failed to load syllabus');
    } finally {
      setLoadingSyl(false);
    }
  };

  const loadQuizzes = async () => {
    setLoadingQuiz(true);
    try {
      const d = await studentAPI.getAvailableQuizzes(selectedLab);
      setQuizzes(d.quizzes);
    } catch {
      toast.error('Failed to load quizzes');
    } finally {
      setLoadingQuiz(false);
    }
  };

  // ── Check-in
  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await studentAPI.checkIn({ lab_id: selectedLab });
      setTodayAttendance({ id: res.attendance_id, checkedOut: false });
      toast.success('Checked in successfully!');
      if (activeTab === 'attendance') loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  // ── Check-out
  const handleCheckOut = async () => {
    if (!todayAttendance) return;
    setCheckingIn(true);
    try {
      await studentAPI.checkOut(todayAttendance.id);
      setTodayAttendance((prev) => ({ ...prev, checkedOut: true }));
      toast.success('Checked out successfully!');
      if (activeTab === 'attendance') loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const currentLab = labs.find((l) => l.id === selectedLab);

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
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
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No labs enrolled</h2>
          <p className="text-gray-400 mt-1">You are not enrolled in any labs yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Labs</h1>
              <p className="text-primary-100 mt-1">{user?.name} · {user?.college_id}</p>
            </div>

            {/* Check-in / Check-out button */}
            <div className="flex items-center gap-3">
              {!todayAttendance ? (
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-50 disabled:opacity-60 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {checkingIn ? 'Checking in...' : 'Check In'}
                </button>
              ) : !todayAttendance.checkedOut ? (
                <button
                  onClick={handleCheckOut}
                  disabled={checkingIn}
                  className="flex items-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-green-50 disabled:opacity-60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {checkingIn ? 'Checking out...' : 'Check Out'}
                </button>
              ) : (
                <span className="flex items-center gap-2 bg-white/20 px-4 py-2.5 rounded-xl text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Attendance recorded
                </span>
              )}
            </div>
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

      {/* ── Lab info bar */}
      {currentLab && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-6 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{currentLab.name}</span>
            <span>Code: <strong>{currentLab.code}</strong></span>
            <span>Semester: <strong>{currentLab.semester}</strong></span>
            <span>Teacher: <strong>{currentLab.teacher_name}</strong></span>
          </div>
        </div>
      )}

      {/* ── Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ════════════════════ EXPERIMENTS ════════════════════ */}
        {activeTab === 'experiments' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Experiments</h2>
            {loadingExp ? (
              <div className="text-center py-12 text-gray-400">Loading experiments...</div>
            ) : experiments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No experiments found for this lab.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {experiments.map((exp) => (
                  <ExperimentCard
                    key={exp.id}
                    experiment={exp}
                    onViewDetail={() => setDetailModal(exp.id)}
                    onUploadRecord={() => setUploadModal({ experiment: exp, type: 'record' })}
                    onUploadOutput={() => setUploadModal({ experiment: exp, type: 'output' })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ ATTENDANCE ════════════════════ */}
        {activeTab === 'attendance' && (
          <div>
            {loadingAtt ? (
              <div className="text-center py-12 text-gray-400">Loading attendance...</div>
            ) : attendance ? (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                    <p className="text-3xl font-bold text-primary-600">{attendance.attended}</p>
                    <p className="text-sm text-gray-500 mt-1">Sessions Attended</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                    <p className="text-3xl font-bold text-gray-800">{attendance.total_sessions}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Sessions</p>
                  </div>
                  <div className={`rounded-2xl shadow-sm border p-5 text-center ${
                    attendance.attendance_percentage >= 75
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-3xl font-bold ${
                      attendance.attendance_percentage >= 75 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {attendance.attendance_percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Attendance Rate</p>
                    {attendance.attendance_percentage < 75 && (
                      <p className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Below 75%
                      </p>
                    )}
                  </div>
                </div>

                {/* Records table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Attendance Records</h3>
                  </div>
                  {attendance.records?.length === 0 ? (
                    <p className="text-center py-8 text-gray-400">No records yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                          <tr>
                            <th className="px-6 py-3 text-left">#</th>
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Check In</th>
                            <th className="px-6 py-3 text-left">Check Out</th>
                            <th className="px-6 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {attendance.records?.map((record, i) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                              <td className="px-6 py-3 text-gray-700">{record.check_in_time?.slice(0, 10)}</td>
                              <td className="px-6 py-3 text-gray-700">{record.check_in_time?.slice(11, 16)}</td>
                              <td className="px-6 py-3 text-gray-700">{record.check_out_time?.slice(11, 16) || '—'}</td>
                              <td className="px-6 py-3">
                                {record.check_out_time
                                  ? <Badge color="green">Complete</Badge>
                                  : <Badge color="yellow">In progress</Badge>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ════════════════════ SYLLABUS ════════════════════ */}
        {activeTab === 'syllabus' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Syllabus</h2>
            {loadingSyl ? (
              <div className="text-center py-12 text-gray-400">Loading syllabus...</div>
            ) : syllabus.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No syllabus uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {syllabus.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.uploaded_at}</p>
                      </div>
                    </div>
                    <a
                      href={`http://localhost:5000${item.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg py-2 hover:bg-primary-50 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ QUIZZES ════════════════════ */}
        {activeTab === 'quizzes' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Quizzes</h2>
            {loadingQuiz ? (
              <div className="text-center py-12 text-gray-400">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No quizzes available right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz) => (
                  <QuizCard key={quiz.quiz_id} quiz={quiz} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals */}
      {uploadModal && (
        <UploadModal
          experiment={uploadModal.experiment}
          type={uploadModal.type}
          onClose={() => setUploadModal(null)}
          onSuccess={() => {
            setUploadModal(null);
            loadExperiments();
          }}
        />
      )}
      {detailModal && (
        <ExperimentDetailModal
          experimentId={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Experiment Card (extracted for readability)
// ────────────────────────────────────────────────────────────
const ExperimentCard = ({ experiment: exp, onViewDetail, onUploadRecord, onUploadOutput }) => {
  const [expanded, setExpanded] = useState(false);
  const isPast = new Date(exp.experiment_date) < new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${isPast ? 'bg-primary-50' : 'bg-amber-50'}`}>
            <FlaskConical className={`w-5 h-5 ${isPast ? 'text-primary-600' : 'text-amber-500'}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{exp.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {exp.experiment_date}
            </p>
          </div>
        </div>

        {/* Status chips */}
        <div className="hidden sm:flex items-center gap-2 ml-4 shrink-0">
          <StatusBadge submitted={exp.record_submitted} status={exp.record_status} />
          {exp.output_submitted
            ? <Badge color="blue">Output ✓</Badge>
            : <Badge color="gray">No output</Badge>}
          {exp.quiz_attempted
            ? <Badge color="green">Quiz ✓</Badge>
            : <Badge color="gray">Quiz pending</Badge>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-2 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-2 shrink-0" />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          {exp.description && (
            <p className="text-sm text-gray-600">{exp.description}</p>
          )}

          {/* Mobile status chips */}
          <div className="flex flex-wrap gap-2 sm:hidden">
            <StatusBadge submitted={exp.record_submitted} status={exp.record_status} />
            {exp.output_submitted ? <Badge color="blue">Output ✓</Badge> : <Badge color="gray">No output</Badge>}
            {exp.quiz_attempted ? <Badge color="green">Quiz ✓</Badge> : <Badge color="gray">Quiz pending</Badge>}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onViewDetail}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-3.5 h-3.5" /> View Details
            </button>
            <button
              onClick={onUploadRecord}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Upload className="w-3.5 h-3.5" />
              {exp.record_submitted ? 'Re-upload Record' : 'Upload Record'}
            </button>
            <button
              onClick={onUploadOutput}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {exp.output_submitted ? 'Re-submit Output' : 'Submit Output'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Quiz Card
// ────────────────────────────────────────────────────────────
const QuizCard = ({ quiz }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{quiz.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">Experiment: {quiz.experiment_title}</p>
      </div>
      {quiz.attempted
        ? <Badge color="green">Attempted</Badge>
        : <Badge color="yellow">New</Badge>}
    </div>

    <div className="flex gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.duration_minutes} min</span>
      <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{quiz.total_marks} marks</span>
    </div>

    {quiz.attempted && quiz.score != null ? (
      <p className="text-sm font-medium text-green-700">
        Score: {quiz.score} / {quiz.total_marks}
      </p>
    ) : !quiz.attempted ? (
      <p className="text-xs text-gray-400">Navigate to Quizzes page to attempt.</p>
    ) : null}
  </div>
);

export default MyLabs;
