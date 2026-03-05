import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../api/teacher';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Plus,
  Upload,
  Calendar,
  FileText,
  Sparkles,
  Download,
  Clock,
} from 'lucide-react';

const Experiments = () => {
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    experiment_date: '',
    file: null,
  });

  const [quizData, setQuizData] = useState({
    title: '',
    num_questions: 5,
    duration_minutes: 30,
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
    if (selectedLab) loadExperiments();
  }, [selectedLab]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await teacherAPI.getExperiments(selectedLab);
      setExperiments(data.experiments);
    } catch (error) {
      toast.error('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExperiment = async (e) => {
    e.preventDefault();

    const formDataObj = new FormData();
    formDataObj.append('lab_id', selectedLab);
    formDataObj.append('title', formData.title);
    formDataObj.append('description', formData.description);
    formDataObj.append('experiment_date', formData.experiment_date);
    
    if (formData.file) {
      formDataObj.append('file', formData.file);
    }

    try {
      await teacherAPI.createExperiment(formDataObj);
      toast.success('Experiment created successfully!');
      setCreateModalOpen(false);
      setFormData({ title: '', description: '', experiment_date: '', file: null });
      loadExperiments();
    } catch (error) {
      toast.error('Failed to create experiment');
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();

    try {
      const result = await teacherAPI.generateQuiz(selectedExperiment.id, quizData);
      toast.success(`Quiz generated with ${result.total_questions} questions!`);
      
      await teacherAPI.deployQuiz(result.quiz_id);
      toast.success('Quiz deployed to students!');
      
      setQuizModalOpen(false);
      setQuizData({ title: '', num_questions: 5, duration_minutes: 30 });
    } catch (error) {
      toast.error('Failed to generate quiz');
    }
  };

  const openQuizModal = (experiment) => {
    setSelectedExperiment(experiment);
    setQuizData({
      title: `${experiment.title} Quiz`,
      num_questions: 5,
      duration_minutes: 30,
    });
    setQuizModalOpen(true);
  };

  if (loading) {
    return <Loading fullScreen message="Loading experiments..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Experiments</h1>
              <p className="text-gray-600 mt-1">Create and manage lab experiments</p>
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
              <button
                onClick={() => setCreateModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Experiment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="card hover:shadow-md transition-shadow duration-200 animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(exp.experiment_date).toLocaleDateString()}</span>
                        <span className="text-gray-400">•</span>
                        <Clock className="w-4 h-4" />
                        <span>Created {new Date(exp.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {exp.description && (
                    <p className="text-gray-700 mb-4 ml-11">{exp.description}</p>
                  )}

                  {exp.file_path && (
                    <div className="ml-11 inline-flex items-center space-x-2 text-sm text-primary-600">
                      <FileText className="w-4 h-4" />
                      <span>Documentation attached</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => openQuizModal(exp)}
                    className="btn-primary text-sm flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Quiz</span>
                  </button>
                  
                  {exp.file_path && (
                    <button className="btn-secondary text-sm flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {experiments.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600">No experiments found</p>
              <p className="text-gray-500 mt-2">Create your first experiment to get started</p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Experiment</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Experiment"
        size="lg"
      >
        <form onSubmit={handleCreateExperiment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experiment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Binary Search Tree Implementation"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the experiment objectives and requirements..."
              className="input-field"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experiment Date *
            </label>
            <input
              type="date"
              value={formData.experiment_date}
              onChange={(e) => setFormData({ ...formData, experiment_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Documentation (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary-600 font-medium">Upload a file</span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 16MB</p>
              {formData.file && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {formData.file.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Create Experiment
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        title="Generate AI Quiz"
      >
        <form onSubmit={handleGenerateQuiz} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">AI-Powered Quiz Generation</p>
                <p className="text-xs text-blue-700 mt-1">
                  Questions will be automatically generated based on the experiment content
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experiment
            </label>
            <input
              type="text"
              value={selectedExperiment?.title || ''}
              disabled
              className="input-field bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              placeholder="e.g., BST Concepts Quiz"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                value={quizData.num_questions}
                onChange={(e) => setQuizData({ ...quizData, num_questions: parseInt(e.target.value) })}
                min="3"
                max="20"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={quizData.duration_minutes}
                onChange={(e) => setQuizData({ ...quizData, duration_minutes: parseInt(e.target.value) })}
                min="10"
                max="120"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setQuizModalOpen(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Generate & Deploy</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Experiments;