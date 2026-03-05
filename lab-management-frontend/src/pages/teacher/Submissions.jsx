import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../api/teacher';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from 'lucide-react';

const Submissions = () => {
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [pendingOutputs, setPendingOutputs] = useState([]);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [evaluationData, setEvaluationData] = useState({
    status: 'accepted',
    marks: '',
    remarks: '',
  });

  useEffect(() => {
    teacherAPI.getManagedLabs()
      .then((d) => {
        setLabs(d.labs);
        if (d.labs.length > 0) setSelectedLab(d.labs[0].id);
      })
      .catch(() => toast.error('Failed to load labs'));
  }, []);

  useEffect(() => {
    if (selectedLab) loadSubmissions();
  }, [selectedLab]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const [subData, outData] = await Promise.all([
        teacherAPI.getPendingSubmissions(selectedLab),
        teacherAPI.getPendingOutputs(selectedLab),
      ]);
      
      setPendingSubmissions(subData.pending_submissions);
      setPendingOutputs(outData.pending_outputs);
    } catch (error) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const openEvaluationModal = (submission) => {
    setSelectedSubmission(submission);
    setEvaluationData({
      status: 'accepted',
      marks: '',
      remarks: '',
    });
    setEvaluationModalOpen(true);
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();

    try {
      await teacherAPI.evaluateSubmission(selectedSubmission.submission_id, evaluationData);
      toast.success('Submission evaluated successfully!');
      setEvaluationModalOpen(false);
      loadSubmissions();
    } catch (error) {
      toast.error('Failed to evaluate submission');
    }
  };

  const handleVerifyOutput = async (outputId, verified) => {
    try {
      await teacherAPI.verifyOutput(outputId, verified);
      toast.success(verified ? 'Output verified!' : 'Output rejected');
      loadSubmissions();
    } catch (error) {
      toast.error('Failed to verify output');
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading submissions..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
              <p className="text-gray-600 mt-1">Review and evaluate student submissions</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Records</p>
                <p className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Outputs</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOutputs.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingSubmissions.length + pendingOutputs.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pending Record Submissions</h2>
            <span className="badge badge-warning">
              {pendingSubmissions.length} pending
            </span>
          </div>

          {pendingSubmissions.length > 0 ? (
            <div className="space-y-3">
              {pendingSubmissions.map((submission) => (
                <div
                  key={submission.submission_id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {submission.experiment_title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {submission.student_name} ({submission.college_id})
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 ml-11">
                        Submitted on {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="btn-secondary text-sm flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => openEvaluationModal(submission)}
                        className="btn-primary text-sm flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Evaluate</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">All record submissions have been reviewed!</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Pending Output Verifications</h2>
            <span className="badge badge-info">
              {pendingOutputs.length} pending
            </span>
          </div>

          {pendingOutputs.length > 0 ? (
            <div className="space-y-3">
              {pendingOutputs.map((output) => (
                <div
                  key={output.output_id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {output.experiment_title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {output.student_name} ({output.college_id})
                          </p>
                        </div>
                      </div>
                      
                      {output.notes && (
                        <div className="ml-11 p-3 bg-gray-50 rounded-lg mb-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span> {output.notes}
                          </p>
                        </div>
                      )}

                      <p className="text-sm text-gray-500 ml-11">
                        Submitted on {new Date(output.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {output.file_path && (
                        <button className="btn-secondary text-sm flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleVerifyOutput(output.output_id, false)}
                        className="btn-danger text-sm flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleVerifyOutput(output.output_id, true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">All output submissions have been verified!</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={evaluationModalOpen}
        onClose={() => setEvaluationModalOpen(false)}
        title="Evaluate Submission"
        size="lg"
      >
        {selectedSubmission && (
          <form onSubmit={handleEvaluate} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedSubmission.experiment_title}
              </h3>
              <p className="text-sm text-gray-600">
                Submitted by {selectedSubmission.student_name} ({selectedSubmission.college_id})
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(selectedSubmission.submitted_at).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Status *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEvaluationData({ ...evaluationData, status: 'accepted' })}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                    evaluationData.status === 'accepted'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Accept</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvaluationData({ ...evaluationData, status: 'rejected' })}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                    evaluationData.status === 'rejected'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Reject</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marks (out of 10) *
              </label>
              <input
                type="number"
                value={evaluationData.marks}
                onChange={(e) => setEvaluationData({ ...evaluationData, marks: e.target.value })}
                min="0"
                max="10"
                step="0.5"
                placeholder="e.g., 8.5"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks & Feedback
              </label>
              <textarea
                value={evaluationData.remarks}
                onChange={(e) => setEvaluationData({ ...evaluationData, remarks: e.target.value })}
                placeholder="Provide feedback to the student..."
                className="input-field"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Constructive feedback helps students improve
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setEvaluationModalOpen(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Submit Evaluation
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Submissions;