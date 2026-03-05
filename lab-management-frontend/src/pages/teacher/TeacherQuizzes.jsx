import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../api/teacher';
import toast from 'react-hot-toast';
import {
  BookOpen, Zap, PlayCircle, BarChart2, Users, CheckCircle,
  Clock, ChevronDown, ChevronUp, X, Trophy, AlertCircle
} from 'lucide-react';

/* ─── Generate Quiz Modal ─── */
const GenerateModal = ({ experiment, onClose, onSuccess }) => {
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(20);
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await teacherAPI.generateQuiz(experiment.id, {
        num_questions: numQuestions,
        time_limit: timeLimit,
      });
      toast.success('Quiz generated!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate Quiz</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{experiment.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={generating}
              className="flex-1 btn-primary disabled:opacity-50">
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Results Modal ─── */
const ResultsModal = ({ quiz, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.getQuizResults(quiz.id)
      .then((d) => setResults(d))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [quiz.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quiz Results</h2>
            <p className="text-sm text-gray-500 mt-0.5">{quiz.experiment_title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto p-6">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading results...</div>
          ) : !results?.results?.length ? (
            <div className="text-center py-10 text-gray-400">
              <BarChart2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              No students have attempted this quiz yet.
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{results.total_students}</p>
                  <p className="text-xs text-blue-600 mt-1">Attempted</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {results.average_score != null ? `${Math.round(results.average_score)}%` : '—'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Avg Score</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-700">{quiz.total_questions || '—'}</p>
                  <p className="text-xs text-purple-600 mt-1">Questions</p>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-left">
                    <th className="px-4 py-2 rounded-l-lg">Student</th>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Score</th>
                    <th className="px-4 py-2 rounded-r-lg">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.student_name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.student_number}</td>
                      <td className="px-4 py-3 text-gray-700">{r.score}/{r.total_questions}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.percentage >= 75
                            ? 'bg-green-100 text-green-700'
                            : r.percentage >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {r.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Experiment Card ─── */
const ExperimentCard = ({ exp, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [resultsModal, setResultsModal] = useState(false);

  const handleDeploy = async (quizId) => {
    setDeploying(true);
    try {
      await teacherAPI.deployQuiz(quizId);
      toast.success('Quiz deployed! Students can now attempt it.');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deploy quiz');
    } finally {
      setDeploying(false);
    }
  };

  const quiz = exp.quiz;
  const hasQuiz = !!quiz;
  const isDeployed = quiz?.status === 'deployed';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-primary-50 rounded-lg shrink-0">
            <BookOpen className="w-5 h-5 text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{exp.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">Exp #{exp.experiment_number || exp.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {hasQuiz ? (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isDeployed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isDeployed ? 'Deployed' : 'Draft'}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              No Quiz
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
          {exp.description && (
            <p className="text-sm text-gray-600">{exp.description}</p>
          )}

          {hasQuiz && (
            <div className="bg-white rounded-xl p-4 space-y-2 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quiz Details</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{quiz.total_questions}</p>
                  <p className="text-xs text-gray-400">Questions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{quiz.time_limit}min</p>
                  <p className="text-xs text-gray-400">Time Limit</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{quiz.attempts_count ?? 0}</p>
                  <p className="text-xs text-gray-400">Attempts</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!hasQuiz && (
              <button
                onClick={() => setGenerateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Zap className="w-4 h-4" /> Generate Quiz
              </button>
            )}
            {hasQuiz && !isDeployed && (
              <>
                <button
                  onClick={() => handleDeploy(quiz.id)}
                  disabled={deploying}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" /> {deploying ? 'Deploying...' : 'Deploy Quiz'}
                </button>
                <button
                  onClick={() => setGenerateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100"
                >
                  <Zap className="w-4 h-4" /> Regenerate
                </button>
              </>
            )}
            {hasQuiz && (
              <button
                onClick={() => setResultsModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100"
              >
                <BarChart2 className="w-4 h-4" /> View Results
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {generateModal && (
        <GenerateModal
          experiment={exp}
          onClose={() => setGenerateModal(false)}
          onSuccess={onRefresh}
        />
      )}
      {resultsModal && quiz && (
        <ResultsModal
          quiz={{ ...quiz, experiment_title: exp.title }}
          onClose={() => setResultsModal(false)}
        />
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const TeacherQuizzes = () => {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    teacherAPI.getManagedLabs()
      .then((d) => {
        setLabs(d.labs);
        if (d.labs.length > 0) setSelectedLab(d.labs[0].id);
      })
      .catch(() => toast.error('Failed to load labs'));
  }, []);

  useEffect(() => {
    if (selectedLab) loadExperiments();
  }, [selectedLab]);

  const loadExperiments = async () => {
    setLoading(true);
    try {
      const data = await teacherAPI.getExperiments(selectedLab);
      setExperiments(data.experiments || []);
    } catch {
      toast.error('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const totalQuizzes = experiments.filter((e) => e.quiz).length;
  const deployedQuizzes = experiments.filter((e) => e.quiz?.status === 'deployed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
              <p className="text-gray-600 mt-1">Generate and deploy quizzes for your lab experiments</p>
            </div>
            <select
              value={selectedLab || ''}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {!loading && experiments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{experiments.length}</p>
                  <p className="text-xs text-gray-500">Total Experiments</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
                  <p className="text-xs text-gray-500">Quizzes Generated</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{deployedQuizzes}</p>
                  <p className="text-xs text-gray-500">Deployed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading experiments...</div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No experiments found</h3>
            <p className="text-gray-400 mt-1">Create experiments first to generate quizzes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiments.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} onRefresh={loadExperiments} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherQuizzes;
