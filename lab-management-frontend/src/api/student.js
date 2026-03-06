import axios from './axios';

export const studentAPI = {
  // Labs
  getEnrolledLabs: async () => {
    const response = await axios.get('/student/labs');
    return response.data;
  },

  // Syllabus
  getSyllabus: async (labId) => {
    const response = await axios.get(`/student/syllabus/${labId}`);
    return response.data;
  },

  // Experiments
  getExperiments: async (labId) => {
    const response = await axios.get(`/student/experiments/${labId}`);
    return response.data;
  },

  getExperimentDetails: async (experimentId) => {
    const response = await axios.get(`/student/experiment/${experimentId}`);
    return response.data;
  },

  // Attendance
  checkIn: async (data) => {
    const response = await axios.post('/student/attendance/check-in', data);
    return response.data;
  },

  checkOut: async (attendanceId) => {
    const response = await axios.post(`/student/attendance/check-out/${attendanceId}`);
    return response.data;
  },

  getMyAttendance: async (labId) => {
    const response = await axios.get(`/student/attendance/my-attendance/${labId}`);
    return response.data;
  },

  // Submissions
  uploadRecord: async (formData) => {
    const response = await axios.post('/student/submission/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadOutput: async (formData) => {
    const response = await axios.post('/student/output/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Quizzes
  getAvailableQuizzes: async (labId) => {
    const response = await axios.get(`/student/quiz/available/${labId}`);
    return response.data;
  },

  startQuiz: async (quizId) => {
    const response = await axios.post(`/student/quiz/start/${quizId}`);
    return response.data;
  },

  retakeQuiz: async (quizId) => {
    const response = await axios.post(`/student/quiz/retake/${quizId}`);
    return response.data;
  },

  submitQuiz: async (attemptId, answers) => {
    const response = await axios.post(`/student/quiz/submit/${attemptId}`, { answers });
    return response.data;
  },

  getQuizResult: async (attemptId) => {
    const response = await axios.get(`/student/quiz/result/${attemptId}`);
    return response.data;
  },

  // Performance
  getMyPerformance: async (labId) => {
    const response = await axios.get(`/student/performance/${labId}`);
    return response.data;
  },

  // Calendar
  getLabCalendar: async (labId, month) => {
    const response = await axios.get(`/student/calendar/${labId}`, {
      params: { month },
    });
    return response.data;
  },
};
