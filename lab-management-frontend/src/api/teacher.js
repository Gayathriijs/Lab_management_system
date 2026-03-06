import axios from './axios';

export const teacherAPI = {
  // Labs
  getManagedLabs: async () => {
    const response = await axios.get('/teacher/labs');
    return response.data;
  },

  // Syllabus
  uploadSyllabus: async (formData) => {
    const response = await axios.post('/teacher/syllabus/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getSyllabus: async (labId) => {
    const response = await axios.get(`/teacher/syllabus/${labId}`);
    return response.data;
  },

  // Experiments
  createExperiment: async (formData) => {
    const response = await axios.post('/teacher/experiment/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getExperiments: async (labId) => {
    const response = await axios.get(`/teacher/experiments/${labId}`);
    return response.data;
  },

  // Attendance
  getDailyAttendance: async (labId, date) => {
    const response = await axios.get(`/teacher/attendance/daily/${labId}`, {
      params: { date },
    });
    return response.data;
  },

  getMonthlyAttendance: async (labId, month) => {
    const response = await axios.get(`/teacher/attendance/monthly/${labId}`, {
      params: { month },
    });
    return response.data;
  },

  getAbsentees: async (labId, threshold = 3) => {
    const response = await axios.get(`/teacher/attendance/absentees/${labId}`, {
      params: { threshold },
    });
    return response.data;
  },

  // Performance
  getStudentPerformance: async (studentId, labId) => {
    const response = await axios.get(`/teacher/performance/student/${studentId}/${labId}`);
    return response.data;
  },

  getClassPerformance: async (labId) => {
    const response = await axios.get(`/teacher/performance/class/${labId}`);
    return response.data;
  },

  // Submissions
  getPendingSubmissions: async (labId) => {
    const response = await axios.get(`/teacher/submissions/pending/${labId}`);
    return response.data;
  },

  evaluateSubmission: async (submissionId, data) => {
    const response = await axios.post(`/teacher/submissions/evaluate/${submissionId}`, data);
    return response.data;
  },

  // Outputs
  getPendingOutputs: async (labId) => {
    const response = await axios.get(`/teacher/outputs/pending/${labId}`);
    return response.data;
  },

  verifyOutput: async (outputId, verified) => {
    const response = await axios.post(`/teacher/outputs/verify/${outputId}`, { verified });
    return response.data;
  },

  // Viva
  addVivaScore: async (data) => {
    const response = await axios.post('/teacher/viva/add', data);
    return response.data;
  },

  // Quiz
  generateQuiz: async (experimentId, data) => {
    const response = await axios.post(`/teacher/quiz/generate/${experimentId}`, data);
    return response.data;
  },

  deployQuiz: async (quizId) => {
    const response = await axios.post(`/teacher/quiz/deploy/${quizId}`);
    return response.data;
  },

  getQuizResults: async (quizId) => {
    const response = await axios.get(`/teacher/quiz/results/${quizId}`);
    return response.data;
  },

  // Enrollment management
  getLabStudents: async (labId) => {
    const response = await axios.get(`/teacher/labs/${labId}/students`);
    return response.data;
  },

  enrollStudent: async (labId, studentId) => {
    const response = await axios.post(`/teacher/labs/${labId}/enroll`, { student_id: studentId });
    return response.data;
  },

  unenrollStudent: async (labId, studentId) => {
    const response = await axios.delete(`/teacher/labs/${labId}/unenroll/${studentId}`);
    return response.data;
  },
};