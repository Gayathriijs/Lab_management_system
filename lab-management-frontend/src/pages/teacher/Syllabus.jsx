import React, { useState, useEffect, useRef } from 'react';
import { teacherAPI } from '../../api/teacher';
import toast from 'react-hot-toast';
import { BookOpen, Upload, FileText, Download, Trash2, Plus, X } from 'lucide-react';

const Syllabus = () => {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [syllabuses, setSyllabuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  // Load labs on mount
  useEffect(() => {
    teacherAPI.getManagedLabs()
      .then((d) => {
        setLabs(d.labs);
        if (d.labs.length > 0) setSelectedLab(d.labs[0].id);
      })
      .catch(() => toast.error('Failed to load labs'));
  }, []);

  // Load syllabuses when lab changes
  useEffect(() => {
    if (selectedLab) loadSyllabuses();
  }, [selectedLab]);

  const loadSyllabuses = async () => {
    setLoading(true);
    try {
      const data = await teacherAPI.getSyllabus(selectedLab);
      setSyllabuses(data.syllabus || []);
    } catch {
      toast.error('Failed to load syllabuses');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a PDF file'); return; }
    if (!title.trim()) { toast.error('Please enter a title'); return; }

    const formData = new FormData();
    formData.append('lab_id', selectedLab);
    formData.append('title', title.trim());
    formData.append('file', file);

    setUploading(true);
    try {
      await teacherAPI.uploadSyllabus(formData);
      toast.success('Syllabus uploaded successfully!');
      setModalOpen(false);
      setTitle('');
      setFile(null);
      loadSyllabuses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const currentLab = labs.find((l) => l.id === selectedLab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Syllabus</h1>
              <p className="text-gray-600 mt-1">Upload and manage lab syllabus PDFs</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedLab || ''}
                onChange={(e) => setSelectedLab(Number(e.target.value))}
                className="input-field"
              >
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
                ))}
              </select>
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Upload Syllabus
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentLab && (
          <div className="mb-6 flex items-center gap-3 text-sm text-gray-500">
            <BookOpen className="w-4 h-4" />
            <span>{currentLab.name} · {currentLab.student_count} students enrolled</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading syllabuses...</div>
        ) : syllabuses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No syllabus uploaded yet</h3>
            <p className="text-gray-400 mt-1">Upload a PDF syllabus for this lab.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {syllabuses.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg shrink-0">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.title}</p>
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

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Upload Syllabus</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures Lab Syllabus"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File <span className="text-red-500">*</span>
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
                      <p className="text-sm text-gray-500">Click to select a PDF</p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Syllabus;
