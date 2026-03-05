export const API_BASE_URL = 'http://localhost:5000/api';

export const ROLES = {
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
};

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB