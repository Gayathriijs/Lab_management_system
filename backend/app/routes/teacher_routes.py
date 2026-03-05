"""
Teacher-specific routes for lab management, experiments, attendance tracking,
and student performance evaluation.
"""

from flask import Blueprint, request, jsonify
from app.auth import token_required, role_required
from app.models import Database, Lab, Experiment
from app.utils import save_file, validate_required_fields, format_datetime, calculate_percentage
from app.config import Config
from datetime import datetime

teacher_bp = Blueprint('teacher', __name__, url_prefix='/api/teacher')


# ==================== LABS MANAGEMENT ====================

@teacher_bp.route('/labs', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_managed_labs(current_user):
    """
    Get all labs managed by the current teacher.
    
    Response:
        {
            "labs": [
                {
                    "id": 1,
                    "name": "Data Structures Lab",
                    "code": "CSE201L",
                    "semester": 3,
                    "student_count": 45
                }
            ]
        }
    """
    try:
        query = """
            SELECT 
                l.id,
                l.name,
                l.code,
                l.semester,
                COUNT(DISTINCT le.student_id) as student_count
            FROM labs l
            LEFT JOIN lab_enrollments le ON l.id = le.lab_id
            WHERE l.teacher_id = %s
            GROUP BY l.id
            ORDER BY l.semester
        """
        labs = Database.execute_query(query, (current_user['id'],), fetch_all=True)
        
        return jsonify({'labs': labs}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== SYLLABUS MANAGEMENT ====================

@teacher_bp.route('/syllabus/upload', methods=['POST'])
@token_required
@role_required(['teacher'])
def upload_syllabus(current_user):
    """
    Upload lab syllabus PDF.
    
    Form Data:
        lab_id: int (Lab ID)
        title: str (Syllabus title)
        file: PDF file
    
    Response:
        {
            "message": "Syllabus uploaded successfully",
            "syllabus_id": 1
        }
    """
    try:
        # Validate form data
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        if 'lab_id' not in request.form or 'title' not in request.form:
            return jsonify({'error': 'Missing required fields: lab_id, title'}), 400
        
        lab_id = request.form['lab_id']
        title = request.form['title']
        file = request.files['file']
        
        # Verify file is PDF
        if not file.filename.endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized: You do not own this lab'}), 403
        
        # Save file
        filepath = save_file(file, Config.SYLLABUS_FOLDER)
        if not filepath:
            return jsonify({'error': 'Failed to save file'}), 500
        
        # Insert into database
        query = """
            INSERT INTO syllabus (lab_id, title, file_path, uploaded_by)
            VALUES (%s, %s, %s, %s)
        """
        syllabus_id = Database.execute_query(
            query,
            (lab_id, title, filepath, current_user['id']),
            commit=True
        )
        
        return jsonify({
            'message': 'Syllabus uploaded successfully',
            'syllabus_id': syllabus_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/syllabus/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_syllabus(current_user, lab_id):
    """
    Get all syllabus files for a lab.
    
    Response:
        {
            "syllabus": [
                {
                    "id": 1,
                    "title": "Data Structures Lab Syllabus",
                    "file_path": "/uploads/syllabus/...",
                    "uploaded_at": "2024-01-15 10:30:00"
                }
            ]
        }
    """
    try:
        query = """
            SELECT id, title, file_path, uploaded_at
            FROM syllabus
            WHERE lab_id = %s
            ORDER BY uploaded_at DESC
        """
        syllabus_list = Database.execute_query(query, (lab_id,), fetch_all=True)
        
        # Format datetime
        for item in syllabus_list:
            item['uploaded_at'] = format_datetime(item['uploaded_at'])
        
        return jsonify({'syllabus': syllabus_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== EXPERIMENT MANAGEMENT ====================

@teacher_bp.route('/experiment/create', methods=['POST'])
@token_required
@role_required(['teacher'])
def create_experiment(current_user):
    """
    Upload experiment documentation.
    
    Form Data:
        lab_id: int
        title: str
        description: str
        experiment_date: str (YYYY-MM-DD)
        file: PDF file (optional)
    
    Response:
        {
            "message": "Experiment created successfully",
            "experiment_id": 1
        }
    """
    try:
        # Get form data
        lab_id = request.form.get('lab_id')
        title = request.form.get('title')
        description = request.form.get('description')
        experiment_date = request.form.get('experiment_date')
        
        # Debug logging
        print(f"DEBUG: Received form data: lab_id={lab_id}, title={title}, experiment_date={experiment_date}, description={description}")
        
        # Validate required fields with specific error messages
        if not lab_id:
            return jsonify({'error': 'Missing required field: lab_id'}), 400
        if not title:
            return jsonify({'error': 'Missing required field: title'}), 400
        if not experiment_date:
            return jsonify({'error': 'Missing required field: experiment_date'}), 400
        
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized: You do not own this lab'}), 403
        
        # Handle file upload (optional)
        filepath = None
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                filepath = save_file(file, Config.EXPERIMENTS_FOLDER)
        
        # Create experiment
        experiment_id = Experiment.create(
            lab_id,
            title,
            description,
            filepath,
            experiment_date,
            current_user['id']
        )
        
        return jsonify({
            'message': 'Experiment created successfully',
            'experiment_id': experiment_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/experiments/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_experiments(current_user, lab_id):
    """
    Get all experiments for a lab.
    
    Response:
        {
            "experiments": [
                {
                    "id": 1,
                    "title": "Linked List Implementation",
                    "description": "...",
                    "experiment_date": "2024-02-01",
                    "created_at": "2024-01-20 14:30:00"
                }
            ]
        }
    """
    try:
        experiments = Experiment.get_by_lab(lab_id)
        
        # Format datetime
        for exp in experiments:
            exp['created_at'] = format_datetime(exp['created_at'])
            exp['experiment_date'] = str(exp['experiment_date'])
        
        return jsonify({'experiments': experiments}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ATTENDANCE TRACKING ====================

@teacher_bp.route('/attendance/daily/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_daily_attendance(current_user, lab_id):
    """
    Get daily attendance for a lab.
    
    Query Parameters:
        date: str (YYYY-MM-DD) - optional, defaults to today
    
    Response:
        {
            "date": "2024-03-03",
            "total_students": 30,
            "present": 28,
            "absent": 2,
            "attendance_list": [
                {
                    "student_name": "Arjun Menon",
                    "college_id": "STU001",
                    "check_in_time": "09:05:00",
                    "check_out_time": "11:30:00",
                    "status": "present"
                }
            ]
        }
    """
    try:
        # Get date from query parameter
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get total enrolled students
        query_total = """
            SELECT COUNT(*) as total
            FROM lab_enrollments
            WHERE lab_id = %s
        """
        total_result = Database.execute_query(query_total, (lab_id,), fetch_one=True)
        total_students = total_result['total']
        
        # Get attendance for the date
        query_attendance = """
            SELECT 
                u.name as student_name,
                u.college_id,
                a.check_in_time,
                a.check_out_time,
                a.status
            FROM attendance a
            INNER JOIN users u ON a.student_id = u.id
            WHERE a.lab_id = %s 
            AND DATE(a.check_in_time) = %s
            ORDER BY a.check_in_time
        """
        attendance_list = Database.execute_query(
            query_attendance,
            (lab_id, date),
            fetch_all=True
        )
        
        # Format times
        for record in attendance_list:
            if record['check_in_time']:
                record['check_in_time'] = record['check_in_time'].strftime('%H:%M:%S')
            if record['check_out_time']:
                record['check_out_time'] = record['check_out_time'].strftime('%H:%M:%S')
        
        present_count = len(attendance_list)
        absent_count = total_students - present_count
        
        return jsonify({
            'date': date,
            'total_students': total_students,
            'present': present_count,
            'absent': absent_count,
            'attendance_list': attendance_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/attendance/monthly/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_monthly_attendance(current_user, lab_id):
    """
    Get monthly attendance summary for a lab.
    
    Query Parameters:
        month: str (YYYY-MM) - optional, defaults to current month
    
    Response:
        {
            "month": "2024-03",
            "summary": [
                {
                    "date": "2024-03-01",
                    "present": 28,
                    "absent": 2
                }
            ]
        }
    """
    try:
        # Get month from query parameter
        month = request.args.get('month', datetime.now().strftime('%Y-%m'))
        
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get total enrolled students
        query_total = """
            SELECT COUNT(*) as total
            FROM lab_enrollments
            WHERE lab_id = %s
        """
        total_result = Database.execute_query(query_total, (lab_id,), fetch_one=True)
        total_students = total_result['total']
        
        # Get daily attendance counts for the month
        query = """
            SELECT 
                DATE(check_in_time) as date,
                COUNT(DISTINCT student_id) as present
            FROM attendance
            WHERE lab_id = %s
            AND DATE_FORMAT(check_in_time, '%Y-%m') = %s
            GROUP BY DATE(check_in_time)
            ORDER BY date
        """
        summary = Database.execute_query(query, (lab_id, month), fetch_all=True)
        
        # Calculate absent count
        for record in summary:
            record['date'] = str(record['date'])
            record['absent'] = total_students - record['present']
        
        return jsonify({
            'month': month,
            'total_students': total_students,
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/attendance/absentees/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_absentees(current_user, lab_id):
    """
    Get list of students who are frequently absent.
    
    Query Parameters:
        threshold: int (minimum absent days, default: 3)
    
    Response:
        {
            "absentees": [
                {
                    "student_name": "Rahul Varma",
                    "college_id": "STU003",
                    "total_classes": 10,
                    "attended": 6,
                    "absent": 4,
                    "attendance_percentage": 60.0
                }
            ]
        }
    """
    try:
        threshold = int(request.args.get('threshold', 3))
        
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get total number of lab sessions
        query_sessions = """
            SELECT COUNT(DISTINCT DATE(check_in_time)) as total_sessions
            FROM attendance
            WHERE lab_id = %s
        """
        sessions_result = Database.execute_query(query_sessions, (lab_id,), fetch_one=True)
        total_sessions = sessions_result['total_sessions'] or 0
        
        # Get student attendance data
        query = """
            SELECT 
                u.id,
                u.name as student_name,
                u.college_id,
                COUNT(DISTINCT DATE(a.check_in_time)) as attended
            FROM lab_enrollments le
            INNER JOIN users u ON le.student_id = u.id
            LEFT JOIN attendance a ON u.id = a.student_id AND a.lab_id = %s
            WHERE le.lab_id = %s
            GROUP BY u.id, u.name, u.college_id
        """
        results = Database.execute_query(query, (lab_id, lab_id), fetch_all=True)
        
        absentees = []
        for student in results:
            attended = student['attended'] or 0
            absent = total_sessions - attended
            
            if absent >= threshold:
                attendance_pct = calculate_percentage(attended, total_sessions)
                
                absentees.append({
                    'student_name': student['student_name'],
                    'college_id': student['college_id'],
                    'total_classes': total_sessions,
                    'attended': attended,
                    'absent': absent,
                    'attendance_percentage': attendance_pct
                })
        
        return jsonify({'absentees': absentees}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== STUDENT PERFORMANCE ====================

@teacher_bp.route('/performance/student/<int:student_id>/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_student_performance(current_user, student_id, lab_id):
    """
    Get detailed performance dashboard for a student.
    
    Response:
        {
            "student": {
                "name": "Arjun Menon",
                "college_id": "STU001"
            },
            "attendance_percentage": 85.5,
            "avg_viva_marks": 8.2,
            "submission_rate": 90.0,
            "avg_quiz_score": 7.5,
            "overall_score": 82.8,
            "details": {
                "total_experiments": 10,
                "records_submitted": 9,
                "quizzes_attempted": 8,
                "total_attendance": 17,
                "total_sessions": 20
            }
        }
    """
    try:
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Import performance service
        from app.services.performance_service import PerformanceService
        
        performance_data = PerformanceService.calculate_student_performance(student_id, lab_id)
        
        if not performance_data:
            return jsonify({'error': 'Performance data not available'}), 404
        
        return jsonify(performance_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/performance/class/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_class_performance(current_user, lab_id):
    """
    Get class average performance metrics.
    
    Response:
        {
            "lab_name": "Data Structures Lab",
            "total_students": 30,
            "class_average": {
                "attendance_percentage": 82.5,
                "avg_quiz_score": 7.2,
                "avg_viva_score": 7.8,
                "submission_rate": 85.0,
                "overall_score": 80.6
            },
            "top_performers": [...],
            "bottom_performers": [...]
        }
    """
    try:
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Import performance service
        from app.services.performance_service import PerformanceService
        
        class_data = PerformanceService.calculate_class_performance(lab_id)
        
        return jsonify(class_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== SUBMISSION EVALUATION ====================

@teacher_bp.route('/submissions/pending/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_pending_submissions(current_user, lab_id):
    """
    Get all pending record submissions for evaluation.
    
    Response:
        {
            "pending_submissions": [
                {
                    "submission_id": 1,
                    "student_name": "Arjun Menon",
                    "college_id": "STU001",
                    "experiment_title": "Binary Search Tree",
                    "submitted_at": "2024-03-01 15:30:00",
                    "file_path": "/uploads/records/..."
                }
            ]
        }
    """
    try:
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        query = """
            SELECT 
                s.id as submission_id,
                u.name as student_name,
                u.college_id,
                e.title as experiment_title,
                s.submitted_at,
                s.file_path
            FROM submissions s
            INNER JOIN users u ON s.student_id = u.id
            INNER JOIN experiments e ON s.experiment_id = e.id
            WHERE e.lab_id = %s
            AND s.status = 'pending'
            ORDER BY s.submitted_at ASC
        """
        submissions = Database.execute_query(query, (lab_id,), fetch_all=True)
        
        # Format datetime
        for sub in submissions:
            sub['submitted_at'] = format_datetime(sub['submitted_at'])
        
        return jsonify({'pending_submissions': submissions}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/submissions/evaluate/<int:submission_id>', methods=['POST'])
@token_required
@role_required(['teacher'])
def evaluate_submission(current_user, submission_id):
    """
    Evaluate a record submission.
    
    Request Body:
        {
            "status": "accepted",  // or "rejected"
            "marks": 8.5,
            "remarks": "Good work, but improve documentation"
        }
    
    Response:
        {
            "message": "Submission evaluated successfully"
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        is_valid, missing = validate_required_fields(data, ['status', 'marks'])
        if not is_valid:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        status = data['status']
        marks = data['marks']
        remarks = data.get('remarks', '')
        
        # Validate status
        if status not in ['accepted', 'rejected']:
            return jsonify({'error': 'Invalid status. Must be accepted or rejected'}), 400
        
        # Update submission
        query = """
            UPDATE submissions
            SET status = %s, marks = %s, remarks = %s,
                evaluated_by = %s, evaluated_at = NOW()
            WHERE id = %s
        """
        Database.execute_query(
            query,
            (status, marks, remarks, current_user['id'], submission_id),
            commit=True
        )
        
        return jsonify({'message': 'Submission evaluated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== OUTPUT VERIFICATION ====================

@teacher_bp.route('/outputs/verify/<int:output_id>', methods=['POST'])
@token_required
@role_required(['teacher'])
def verify_output(current_user, output_id):
    """
    Verify experiment output submission.
    
    Request Body:
        {
            "verified": true
        }
    
    Response:
        {
            "message": "Output verified successfully"
        }
    """
    try:
        data = request.get_json()
        
        verified = data.get('verified', False)
        
        query = """
            UPDATE output_verifications
            SET verified = %s, verified_by = %s, verified_at = NOW()
            WHERE id = %s
        """
        Database.execute_query(
            query,
            (verified, current_user['id'], output_id),
            commit=True
        )
        
        return jsonify({'message': 'Output verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/outputs/pending/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_pending_outputs(current_user, lab_id):
    """
    Get all pending output verifications.
    
    Response:
        {
            "pending_outputs": [...]
        }
    """
    try:
        # Verify teacher owns this lab
        lab = Lab.get_by_id(lab_id)
        if not lab or lab['teacher_id'] != current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        query = """
            SELECT 
                ov.id as output_id,
                u.name as student_name,
                u.college_id,
                e.title as experiment_title,
                ov.file_path,
                ov.notes,
                ov.submitted_at
            FROM output_verifications ov
            INNER JOIN users u ON ov.student_id = u.id
            INNER JOIN experiments e ON ov.experiment_id = e.id
            WHERE e.lab_id = %s
            AND ov.verified = FALSE
            ORDER BY ov.submitted_at ASC
        """
        outputs = Database.execute_query(query, (lab_id,), fetch_all=True)
        
        # Format datetime
        for output in outputs:
            output['submitted_at'] = format_datetime(output['submitted_at'])
        
        return jsonify({'pending_outputs': outputs}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== VIVA SCORES ====================

@teacher_bp.route('/viva/add', methods=['POST'])
@token_required
@role_required(['teacher'])
def add_viva_score(current_user):
    """
    Add viva marks for a student.
    
    Request Body:
        {
            "student_id": 1,
            "experiment_id": 5,
            "marks": 8.5,
            "max_marks": 10.0,
            "remarks": "Good understanding of concepts"
        }
    
    Response:
        {
            "message": "Viva score added successfully"
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        is_valid, missing = validate_required_fields(
            data, 
            ['student_id', 'experiment_id', 'marks']
        )
        if not is_valid:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        query = """
            INSERT INTO viva_scores 
            (student_id, experiment_id, marks, max_marks, remarks, evaluated_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            marks = VALUES(marks),
            max_marks = VALUES(max_marks),
            remarks = VALUES(remarks),
            evaluated_by = VALUES(evaluated_by),
            evaluated_at = NOW()
        """
        
        Database.execute_query(
            query,
            (
                data['student_id'],
                data['experiment_id'],
                data['marks'],
                data.get('max_marks', 10.0),
                data.get('remarks', ''),
                current_user['id']
            ),
            commit=True
        )
        
        return jsonify({'message': 'Viva score added successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== QUIZ MANAGEMENT ====================

@teacher_bp.route('/quiz/generate/<int:experiment_id>', methods=['POST'])
@token_required
@role_required(['teacher'])
def generate_quiz(current_user, experiment_id):
    """
    Generate AI-based quiz questions for an experiment.
    
    Request Body:
        {
            "title": "Binary Search Tree Quiz",
            "num_questions": 5,
            "duration_minutes": 30
        }
    
    Response:
        {
            "message": "Quiz generated successfully",
            "quiz_id": 1,
            "questions": [...]
        }
    """
    try:
        data = request.get_json()
        
        # Import quiz service
        from app.services.quiz_service import QuizService
        
        quiz_data = QuizService.generate_quiz(
            experiment_id,
            data.get('title', 'Quiz'),
            data.get('num_questions', 5),
            data.get('duration_minutes', 30),
            current_user['id']
        )
        
        return jsonify(quiz_data), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/quiz/deploy/<int:quiz_id>', methods=['POST'])
@token_required
@role_required(['teacher'])
def deploy_quiz(current_user, quiz_id):
    """
    Deploy quiz to students (activate it).
    
    Response:
        {
            "message": "Quiz deployed successfully"
        }
    """
    try:
        query = """
            UPDATE quizzes
            SET is_active = TRUE
            WHERE id = %s
        """
        Database.execute_query(query, (quiz_id,), commit=True)
        
        return jsonify({'message': 'Quiz deployed successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/quiz/results/<int:quiz_id>', methods=['GET'])
@token_required
@role_required(['teacher'])
def get_quiz_results(current_user, quiz_id):
    """
    Get quiz results for all students.
    
    Response:
        {
            "quiz_title": "Binary Search Tree Quiz",
            "total_attempts": 25,
            "average_score": 7.5,
            "results": [
                {
                    "student_name": "Arjun Menon",
                    "college_id": "STU001",
                    "score": 8.5,
                    "total_marks": 10.0,
                    "percentage": 85.0,
                    "submitted_at": "2024-03-01 16:45:00"
                }
            ]
        }
    """
    try:
        # Get quiz info
        quiz_query = "SELECT title, total_marks FROM quizzes WHERE id = %s"
        quiz = Database.execute_query(quiz_query, (quiz_id,), fetch_one=True)
        
        if not quiz:
            return jsonify({'error': 'Quiz not found'}), 404
        
        # Get attempts
        query = """
            SELECT 
                u.name as student_name,
                u.college_id,
                qa.score,
                qa.total_marks,
                qa.submitted_at
            FROM quiz_attempts qa
            INNER JOIN users u ON qa.student_id = u.id
            WHERE qa.quiz_id = %s
            ORDER BY qa.score DESC
        """
        results = Database.execute_query(query, (quiz_id,), fetch_all=True)
        
        # Calculate statistics
        total_attempts = len(results)
        avg_score = 0
        
        if total_attempts > 0:
            total_score = sum(r['score'] for r in results)
            avg_score = round(total_score / total_attempts, 2)
        
        # Add percentage to each result
        for result in results:
            result['percentage'] = calculate_percentage(
                result['score'], 
                result['total_marks']
            )
            result['submitted_at'] = format_datetime(result['submitted_at'])
        
        return jsonify({
            'quiz_title': quiz['title'],
            'total_attempts': total_attempts,
            'average_score': avg_score,
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500