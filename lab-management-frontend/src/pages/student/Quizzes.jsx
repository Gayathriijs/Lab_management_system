import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentAPI } from '../../api/student';
import toast from 'react-hot-toast';
import {
  Award,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  FlaskConical,
  X,
  BookOpen,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Timer
// ────────────────────────────────────────────────────────────
const Timer = ({ durationMinutes, onExpire }) => {
  const [seconds, setSeconds] = useState(durationMinutes * 60);
  const ref = useRef();

  useEffect(() => {
    ref.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const urgent = seconds < 60;

  return (
    <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${urgent ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
      <Clock className="w-5 h-5" />
      {m}:{s}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Result Modal
// ────────────────────────────────────────────────────────────
const ResultModal = ({ attemptId, onClose }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    studentAPI
      .getQuizResult(attemptId)
      .then((d) => setResult(d))
      .catch(() => toast.error('Failed to load result'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'd' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Quiz Result</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading result...</div>
        ) : result ? (
          <div className="p-6 space-y-6">
            {/* Score summary */}
            <div className="text-center">
              <p className="text-gray-500 text-sm">{result.quiz_title}</p>
              <div className={`mt-3 inline-flex items-center justify-center w-28 h-28 rounded-full border-4 ${
                result.percentage >= 60 ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
              }`}>
                <div>
                  <p className={`text-3xl font-extrabold ${result.percentage >= 60 ? 'text-green-700' : 'text-red-700'}`}>
                    {result.percentage?.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">{result.score}/{result.total_marks}</p>
                </div>
              </div>
              <p className={`mt-3 font-semibold ${result.percentage >= 60 ? 'text-green-700' : 'text-red-600'}`}>
                {result.percentage >= 75 ? '🎉 Excellent!' : result.percentage >= 60 ? '👍 Good job' : '😕 Needs improvement'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Submitted: {result.submitted_at}</p>
            </div>

            {/* Answer breakdown toggle */}
            <div>
              <button
                onClick={() => setShowAnswers((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span>View Answer Breakdown</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showAnswers ? 'rotate-90' : ''}`} />
              </button>

              {showAnswers && (
                <div className="mt-3 space-y-4">
                  {result.answers?.map((ans, i) => (
                    <div key={i} className={`rounded-xl border p-4 ${ans.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-2">
                        {ans.is_correct
                          ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                          : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Q{i + 1}. {ans.question_text}
                          </p>
                          {['a', 'b', 'c', 'd'].map((opt) => (
                            <div
                              key={opt}
                              className={`flex items-center gap-2 text-sm py-1 px-3 rounded-lg mb-1 ${
                                opt === ans.correct_answer
                                  ? 'bg-green-100 text-green-800 font-medium'
                                  : opt === ans.selected_answer && !ans.is_correct
                                  ? 'bg-red-100 text-red-800'
                                  : 'text-gray-600'
                              }`}
                            >
                              <span className="font-mono text-xs w-4">{opt.toUpperCase()}.</span>
                              {ans[`option_${opt}`]}
                              {opt === ans.correct_answer && <span className="ml-auto text-xs text-green-700">✓ Correct</span>}
                              {opt === ans.selected_answer && opt !== ans.correct_answer && (
                                <span className="ml-auto text-xs text-red-600">Your answer</span>
                              )}
                            </div>
                          ))}
                          <p className="text-xs text-gray-400 mt-1 text-right">{ans.marks} mark{ans.marks !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Active Quiz (questions view)
// ────────────────────────────────────────────────────────────
const ActiveQuiz = ({ quizSession, onSubmit, onQuit }) => {
  const { attempt_id, quiz_title, duration_minutes, total_marks, questions } = quizSession;
  const [answers, setAnswers] = useState({}); // { questionId: 'a'|'b'|'c'|'d' }
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (qId, opt) => {
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]).length;
    if (unanswered > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway?`
      );
      if (!confirmed) return;
    }
    setSubmitting(true);
    try {
      const formatted = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id] || '',
      }));
      const res = await studentAPI.submitQuiz(attempt_id, formatted);
      toast.success(`Quiz submitted! Score: ${res.score}/${res.total_marks}`);
      onSubmit(attempt_id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const q = questions[currentQ];
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky quiz bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate text-sm">{quiz_title}</p>
            <p className="text-xs text-gray-400">{answered}/{questions.length} answered · {total_marks} total marks</p>
          </div>
          <Timer durationMinutes={duration_minutes} onExpire={handleSubmit} />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 shrink-0"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-500 transition-all"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Question navigator dots */}
        <div className="flex flex-wrap gap-2 mb-6">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                i === currentQ
                  ? 'bg-primary-600 text-white'
                  : answers[q.id]
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 bg-primary-50 text-primary-700 font-bold text-sm rounded-full flex items-center justify-center">
              {currentQ + 1}
            </span>
            <p className="text-gray-900 font-medium leading-relaxed">{q.question_text}</p>
          </div>

          <div className="p-4 space-y-2">
            {['a', 'b', 'c', 'd'].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                  answers[q.id] === opt
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-transparent bg-gray-50 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => handleSelect(q.id, opt)}
                  className="accent-primary-600 w-4 h-4"
                />
                <span className="font-mono text-xs text-gray-400 w-4">{opt.toUpperCase()}.</span>
                <span className="text-sm text-gray-800">{q[`option_${opt}`]}</span>
              </label>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentQ((i) => Math.max(0, i - 1))}
              disabled={currentQ === 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setCurrentQ((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentQ === questions.length - 1}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Quiz List Card
// ────────────────────────────────────────────────────────────
const QuizCard = ({ quiz, onStart, onViewResult }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{quiz.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          <FlaskConical className="w-3.5 h-3.5" /> {quiz.experiment_title}
        </p>
      </div>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        quiz.attempted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {quiz.attempted ? 'Completed' : 'Not attempted'}
      </span>
    </div>

    <div className="flex gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {quiz.duration_minutes} min</span>
      <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {quiz.total_marks} marks</span>
    </div>

    {quiz.attempted ? (
      <button
        onClick={() => onViewResult(quiz)}
        className="w-full py-2 border border-primary-300 text-primary-700 text-sm font-medium rounded-xl hover:bg-primary-50 transition-colors"
      >
        View Result
      </button>
    ) : (
      <button
        onClick={() => onStart(quiz)}
        className="w-full py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
      >
        Start Quiz
      </button>
    )}
  </div>
);

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
const Quizzes = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Active quiz session: { attempt_id, quiz_title, duration_minutes, total_marks, questions }
  const [activeSession, setActiveSession] = useState(null);

  // Result modal
  const [resultAttemptId, setResultAttemptId] = useState(null);

  // ── Load labs
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

  // ── Load quizzes when lab changes
  useEffect(() => {
    if (!selectedLab) return;
    setLoadingQuizzes(true);
    studentAPI
      .getAvailableQuizzes(selectedLab)
      .then((d) => setQuizzes(d.quizzes))
      .catch(() => toast.error('Failed to load quizzes'))
      .finally(() => setLoadingQuizzes(false));
  }, [selectedLab]);

  // ── Start quiz
  const handleStart = async (quiz) => {
    const confirmed = window.confirm(
      `Start "${quiz.title}"?\nDuration: ${quiz.duration_minutes} minutes · ${quiz.total_marks} marks\n\nThe timer will begin immediately.`
    );
    if (!confirmed) return;
    try {
      const session = await studentAPI.startQuiz(quiz.quiz_id);
      setActiveSession(session);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start quiz');
    }
  };

  // ── View result for already-attempted quiz
  // We need to fetch attempts to get attempt_id. For now we look it up via start
  // The backend returns 400 "already attempted" — handle gracefully
  const handleViewResult = async (quiz) => {
    // We don't have attempt_id in the list response.
    // Try calling start to get the "already attempted" error which
    // doesn't give us the id. Instead, open result modal with quiz_id
    // by fetching the list with attempt info via performance or storing it.
    // Workaround: we stored attempt_id after submit — check quizResult map.
    if (quizResultMap[quiz.quiz_id]) {
      setResultAttemptId(quizResultMap[quiz.quiz_id]);
    } else {
      toast('To view past results, attempt IDs are needed. Use the performance page for full history.');
    }
  };

  // Store attempt_id after submission
  const [quizResultMap, setQuizResultMap] = useState({}); // { quiz_id: attempt_id }

  const handleSubmitted = (attemptId) => {
    // refresh list
    setActiveSession(null);
    if (selectedLab) {
      studentAPI.getAvailableQuizzes(selectedLab).then((d) => setQuizzes(d.quizzes));
    }
    setResultAttemptId(attemptId);
  };

  // ── If quiz is active, show the full-screen quiz view
  if (activeSession) {
    return (
      <ActiveQuiz
        quizSession={activeSession}
        onSubmit={handleSubmitted}
        onQuit={() => setActiveSession(null)}
      />
    );
  }

  if (loadingLabs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const pending  = quizzes.filter((q) => !q.attempted);
  const done     = quizzes.filter((q) => q.attempted);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Quizzes</h1>
              <p className="text-primary-100 mt-1">{user?.name} · {user?.college_id}</p>
            </div>
            <div className="flex items-center gap-4 bg-white/20 rounded-xl px-4 py-3">
              <div className="text-center">
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-xs text-primary-100">Pending</p>
              </div>
              <div className="w-px h-8 bg-white/30" />
              <div className="text-center">
                <p className="text-2xl font-bold">{done.length}</p>
                <p className="text-xs text-primary-100">Completed</p>
              </div>
            </div>
          </div>

          {/* Lab selector */}
          {labs.length > 1 && (
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
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loadingQuizzes ? (
          <div className="text-center py-16 text-gray-400">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Award className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No quizzes available yet.</p>
            <p className="text-sm mt-1">Your teacher will deploy quizzes for each experiment.</p>
          </div>
        ) : (
          <>
            {/* Pending quizzes */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Pending Quizzes
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pending.map((quiz) => (
                    <QuizCard
                      key={quiz.quiz_id}
                      quiz={quiz}
                      onStart={handleStart}
                      onViewResult={handleViewResult}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed quizzes */}
            {done.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Completed Quizzes
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">{done.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {done.map((quiz) => (
                    <QuizCard
                      key={quiz.quiz_id}
                      quiz={quiz}
                      onStart={handleStart}
                      onViewResult={handleViewResult}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800">
              <p className="font-semibold mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Quiz Instructions</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Once started, the timer cannot be paused.</li>
                <li>Each quiz can only be attempted once.</li>
                <li>Unanswered questions count as incorrect.</li>
                <li>Results are shown immediately after submission.</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Result modal (shown after submission or clicking "View Result") */}
      {resultAttemptId && (
        <ResultModal
          attemptId={resultAttemptId}
          onClose={() => setResultAttemptId(null)}
        />
      )}
    </div>
  );
};

export default Quizzes;
