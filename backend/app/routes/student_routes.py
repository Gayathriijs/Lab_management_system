"""
Student-specific routes for viewing experiments, attendance management,
submissions, quizzes, and performance tracking.
"""

from flask import Blueprint, request, jsonify
from app.auth import token_required, role_required
from app.models import Database, Lab, Experiment
from app.utils import save_file, validate_required_fields, format_datetime, calculate_percentage
from app.config import Config
from datetime import datetime

student_bp = Blueprint('student', __name__, url_prefix='/api/student')


# ==================== LAB ENROLLMENT ====================

@student_bp.route('/labs', methods=['GET'])
@token_required
@role_required(['student'])
def get_enrolled_labs(current_user):
    """
    Get all labs the student is enrolled in.
    
    Response:
        {
            "labs": [
                {
                    "id": 1,
                    "name": "Data Structures Lab",
                    "code": "CSE201L",
                    "semester": 3,
                    "teacher_name": "Dr. Rajesh Kumar"
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
                u.name as teacher_name
            FROM labs l
            INNER JOIN lab_enrollments le ON l.id = le.lab_id
            INNER JOIN users u ON l.teacher_id = u.id
            WHERE le.student_id = %s
            ORDER BY l.semester
        """
        labs = Database.execute_query(query, (current_user['id'],), fetch_all=True)
        
        return jsonify({'labs': labs}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== SYLLABUS ====================

@student_bp.route('/syllabus/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_syllabus(current_user, lab_id):
    """
    Get syllabus for a lab.
    
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
        # Verify student is enrolled in this lab
        enrollment_query = """
            SELECT id FROM lab_enrollments
            WHERE student_id = %s AND lab_id = %s
        """
        enrollment = Database.execute_query(
            enrollment_query,
            (current_user['id'], lab_id),
            fetch_one=True
        )
        
        if not enrollment:
            return jsonify({'error': 'Not enrolled in this lab'}), 403
        
        # Get syllabus
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


# ==================== EXPERIMENTS ====================

@student_bp.route('/experiments/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_experiments(current_user, lab_id):
    """
    Get all experiments for a lab with submission status.
    
    Response:
        {
            "experiments": [
                {
                    "id": 1,
                    "title": "Linked List Implementation",
                    "description": "...",
                    "file_path": "/uploads/experiments/...",
                    "experiment_date": "2024-02-01",
                    "record_submitted": true,
                    "record_status": "accepted",
                    "output_submitted": true,
                    "quiz_attempted": true
                }
            ]
        }
    """
    try:
        # Verify enrollment
        enrollment_query = """
            SELECT id FROM lab_enrollments
            WHERE student_id = %s AND lab_id = %s
        """
        enrollment = Database.execute_query(
            enrollment_query,
            (current_user['id'], lab_id),
            fetch_one=True
        )
        
        if not enrollment:
            return jsonify({'error': 'Not enrolled in this lab'}), 403
        
        # Get experiments with submission status
        query = """
            SELECT 
                e.id,
                e.title,
                e.description,
                e.file_path,
                e.experiment_date,
                s.id IS NOT NULL as record_submitted,
                s.status as record_status,
                ov.id IS NOT NULL as output_submitted,
                qa.id IS NOT NULL as quiz_attempted
            FROM experiments e
            LEFT JOIN submissions s ON e.id = s.experiment_id AND s.student_id = %s
            LEFT JOIN output_verifications ov ON e.id = ov.experiment_id AND ov.student_id = %s
            LEFT JOIN quizzes q ON e.id = q.experiment_id
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = %s
            WHERE e.lab_id = %s
            ORDER BY e.experiment_date DESC
        """
        experiments = Database.execute_query(
            query,
            (current_user['id'], current_user['id'], current_user['id'], lab_id),
            fetch_all=True
        )
        
        # Format data
        for exp in experiments:
            exp['experiment_date'] = str(exp['experiment_date'])
            exp['record_submitted'] = bool(exp['record_submitted'])
            exp['output_submitted'] = bool(exp['output_submitted'])
            exp['quiz_attempted'] = bool(exp['quiz_attempted'])
        
        return jsonify({'experiments': experiments}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/experiment/<int:experiment_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_experiment_details(current_user, experiment_id):
    """
    Get detailed information about an experiment.
    
    Response:
        {
            "experiment": {...},
            "submission_status": {...},
            "quiz_info": {...}
        }
    """
    try:
        # Get experiment
        experiment = Experiment.get_by_id(experiment_id)
        
        if not experiment:
            return jsonify({'error': 'Experiment not found'}), 404
        
        # Get submission status
        sub_query = """
            SELECT id, status, marks, remarks, submitted_at
            FROM submissions
            WHERE student_id = %s AND experiment_id = %s
        """
        submission = Database.execute_query(
            sub_query,
            (current_user['id'], experiment_id),
            fetch_one=True
        )
        
        # Get quiz info
        quiz_query = """
            SELECT q.id, q.title, q.duration_minutes, q.total_marks,
                   qa.score, qa.submitted_at as attempt_date
            FROM quizzes q
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = %s
            WHERE q.experiment_id = %s AND q.is_active = TRUE
        """
        quiz = Database.execute_query(
            quiz_query,
            (current_user['id'], experiment_id),
            fetch_one=True
        )
        
        # Format data
        experiment['experiment_date'] = str(experiment['experiment_date'])
        experiment['created_at'] = format_datetime(experiment['created_at'])
        
        if submission:
            submission['submitted_at'] = format_datetime(submission['submitted_at'])
        
        if quiz and quiz['attempt_date']:
            quiz['attempt_date'] = format_datetime(quiz['attempt_date'])
        
        return jsonify({
            'experiment': experiment,
            'submission_status': submission,
            'quiz_info': quiz
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ATTENDANCE ====================

@student_bp.route('/attendance/check-in', methods=['POST'])
@token_required
@role_required(['student'])
def check_in(current_user):
    """
    Record student check-in.
    
    Request Body:
        {
            "lab_id": 1,
            "experiment_id": 5  // optional
        }
    
    Response:
        {
            "message": "Checked in successfully",
            "attendance_id": 123,
            "check_in_time": "2024-03-03 09:05:00"
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        is_valid, missing = validate_required_fields(data, ['lab_id'])
        if not is_valid:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        lab_id = data['lab_id']
        experiment_id = data.get('experiment_id')
        
        # Verify enrollment
        enrollment_query = """
            SELECT id FROM lab_enrollments
            WHERE student_id = %s AND lab_id = %s
        """
        enrollment = Database.execute_query(
            enrollment_query,
            (current_user['id'], lab_id),
            fetch_one=True
        )
        
        if not enrollment:
            return jsonify({'error': 'Not enrolled in this lab'}), 403
        
        # Check if already checked in today
        check_query = """
            SELECT id FROM attendance
            WHERE student_id = %s AND lab_id = %s
            AND DATE(check_in_time) = CURDATE()
        """
        existing = Database.execute_query(
            check_query,
            (current_user['id'], lab_id),
            fetch_one=True
        )
        
        if existing:
            return jsonify({'error': 'Already checked in today'}), 400
        
        # Record check-in
        from app.models import Attendance
        attendance_id = Attendance.check_in(current_user['id'], lab_id, experiment_id)
        
        return jsonify({
            'message': 'Checked in successfully',
            'attendance_id': attendance_id,
            'check_in_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/attendance/check-out/<int:attendance_id>', methods=['POST'])
@token_required
@role_required(['student'])
def check_out(current_user, attendance_id):
    """
    Record student check-out.
    
    Response:
        {
            "message": "Checked out successfully",
            "check_out_time": "2024-03-03 11:30:00"
        }
    """
    try:
        # Verify attendance belongs to student
        verify_query = """
            SELECT id FROM attendance
            WHERE id = %s AND student_id = %s
        """
        attendance = Database.execute_query(
            verify_query,
            (attendance_id, current_user['id']),
            fetch_one=True
        )
        
        if not attendance:
            return jsonify({'error': 'Attendance record not found'}), 404
        
        # Record check-out
        from app.models import Attendance
        Attendance.check_out(attendance_id)
        
        return jsonify({
            'message': 'Checked out successfully',
            'check_out_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/attendance/my-attendance/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_my_attendance(current_user, lab_id):
    """
    Get student's own attendance records.
    
    Response:
        {
            "total_sessions": 20,
            "attended": 17,
            "attendance_percentage": 85.0,
            "records": [...]
        }
    """
    try:
        # Get attendance records
        from app.models import Attendance
        records = Attendance.get_student_attendance(current_user['id'], lab_id)
        
        # Get total sessions
        total_query = """
            SELECT COUNT(DISTINCT DATE(check_in_time)) as total
            FROM attendance
            WHERE lab_id = %s
        """
        total_result = Database.execute_query(total_query, (lab_id,), fetch_one=True)
        total_sessions = total_result['total'] or 0
        
        attended = len(records)
        attendance_pct = calculate_percentage(attended, total_sessions)
        
        # Format records
        for record in records:
            record['check_in_time'] = format_datetime(record['check_in_time'])
            if record['check_out_time']:
                record['check_out_time'] = format_datetime(record['check_out_time'])
        
        return jsonify({
            'total_sessions': total_sessions,
            'attended': attended,
            'attendance_percentage': attendance_pct,
            'records': records
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== SUBMISSIONS ====================

@student_bp.route('/submission/upload', methods=['POST'])
@token_required
@role_required(['student'])
def upload_record(current_user):
    """
    Upload record for verification.
    
    Form Data:
        experiment_id: int
        file: PDF/DOC file
    
    Response:
        {
            "message": "Record submitted successfully",
            "submission_id": 1
        }
    """
    try:
        # Validate form data
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        if 'experiment_id' not in request.form:
            return jsonify({'error': 'Missing experiment_id'}), 400
        
        experiment_id = request.form['experiment_id']
        file = request.files['file']
        
        # Save file
        filepath = save_file(file, Config.RECORDS_FOLDER)
        if not filepath:
            return jsonify({'error': 'Failed to save file'}), 500
        
        # Check if already submitted
        check_query = """
            SELECT id FROM submissions
            WHERE student_id = %s AND experiment_id = %s
        """
        existing = Database.execute_query(
            check_query,
            (current_user['id'], experiment_id),
            fetch_one=True
        )
        
        if existing:
            # Update existing submission
            update_query = """
                UPDATE submissions
                SET file_path = %s, status = 'pending', submitted_at = NOW()
                WHERE id = %s
            """
            Database.execute_query(
                update_query,
                (filepath, existing['id']),
                commit=True
            )
            submission_id = existing['id']
        else:
            # Create new submission
            insert_query = """
                INSERT INTO submissions (student_id, experiment_id, file_path)
                VALUES (%s, %s, %s)
            """
            submission_id = Database.execute_query(
                insert_query,
                (current_user['id'], experiment_id, filepath),
                commit=True
            )
        
        return jsonify({
            'message': 'Record submitted successfully',
            'submission_id': submission_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/output/upload', methods=['POST'])
@token_required
@role_required(['student'])
def upload_output(current_user):
    """
    Upload experiment output.
    
    Form Data:
        experiment_id: int
        notes: str (optional)
        file: file (optional)
    
    Response:
        {
            "message": "Output submitted successfully",
            "output_id": 1
        }
    """
    try:
        experiment_id = request.form.get('experiment_id')
        notes = request.form.get('notes', '')
        
        if not experiment_id:
            return jsonify({'error': 'Missing experiment_id'}), 400
        
        # Handle file upload (optional)
        filepath = None
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                filepath = save_file(file, Config.OUTPUTS_FOLDER)
        
        # Check if already submitted
        check_query = """
            SELECT id FROM output_verifications
            WHERE student_id = %s AND experiment_id = %s
        """
        existing = Database.execute_query(
            check_query,
            (current_user['id'], experiment_id),
            fetch_one=True
        )
        
        if existing:
            # Update existing
            update_query = """
                UPDATE output_verifications
                SET file_path = %s, notes = %s, verified = FALSE, submitted_at = NOW()
                WHERE id = %s
            """
            Database.execute_query(
                update_query,
                (filepath, notes, existing['id']),
                commit=True
            )
            output_id = existing['id']
        else:
            # Create new
            insert_query = """
                INSERT INTO output_verifications 
                (student_id, experiment_id, file_path, notes)
                VALUES (%s, %s, %s, %s)
            """
            output_id = Database.execute_query(
                insert_query,
                (current_user['id'], experiment_id, filepath, notes),
                commit=True
            )
        
        return jsonify({
            'message': 'Output submitted successfully',
            'output_id': output_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== QUIZZES ====================

@student_bp.route('/quiz/available/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_available_quizzes(current_user, lab_id):
    """
    Get available quizzes for a lab.
    
    Response:
        {
            "quizzes": [
                {
                    "quiz_id": 1,
                    "title": "Binary Search Tree Quiz",
                    "experiment_title": "BST Implementation",
                    "duration_minutes": 30,
                    "total_marks": 10.0,
                    "attempted": false
                }
            ]
        }
    """
    try:
        query = """
            SELECT 
                q.id as quiz_id,
                q.title,
                e.title as experiment_title,
                q.duration_minutes,
                q.total_marks,
                qa.id IS NOT NULL as attempted
            FROM quizzes q
            INNER JOIN experiments e ON q.experiment_id = e.id
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = %s
            WHERE e.lab_id = %s AND q.is_active = TRUE
            ORDER BY e.experiment_date DESC
        """
        quizzes = Database.execute_query(
            query,
            (current_user['id'], lab_id),
            fetch_all=True
        )
        
        # Format data
        for quiz in quizzes:
            quiz['attempted'] = bool(quiz['attempted'])
        
        return jsonify({'quizzes': quizzes}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/quiz/start/<int:quiz_id>', methods=['POST'])
@token_required
@role_required(['student'])
def start_quiz(current_user, quiz_id):
    """
    Start a quiz attempt and get questions.
    
    Response:
        {
            "attempt_id": 1,
            "quiz_title": "Binary Search Tree Quiz",
            "duration_minutes": 30,
            "total_marks": 10.0,
            "questions": [
                {
                    "id": 1,
                    "question_text": "What is the time complexity...",
                    "option_a": "O(1)",
                    "option_b": "O(log n)",
                    "option_c": "O(n)",
                    "option_d": "O(n log n)",
                    "marks": 2.0
                }
            ]
        }
    """
    try:
        # Check if already attempted
        check_query = """
            SELECT id FROM quiz_attempts
            WHERE quiz_id = %s AND student_id = %s
        """
        existing = Database.execute_query(
            check_query,
            (quiz_id, current_user['id']),
            fetch_one=True
        )
        
        if existing:
            return jsonify({'error': 'Quiz already attempted'}), 400
        
        # Get quiz info
        quiz_query = """
            SELECT title, duration_minutes, total_marks
            FROM quizzes
            WHERE id = %s AND is_active = TRUE
        """
        quiz = Database.execute_query(quiz_query, (quiz_id,), fetch_one=True)
        
        if not quiz:
            return jsonify({'error': 'Quiz not found or not active'}), 404
        
        # Create attempt
        attempt_query = """
            INSERT INTO quiz_attempts (quiz_id, student_id, total_marks)
            VALUES (%s, %s, %s)
        """
        attempt_id = Database.execute_query(
            attempt_query,
            (quiz_id, current_user['id'], quiz['total_marks']),
            commit=True
        )
        
        # Get questions (without correct answers)
        questions_query = """
            SELECT id, question_text, option_a, option_b, option_c, option_d, marks
            FROM quiz_questions
            WHERE quiz_id = %s
        """
        questions = Database.execute_query(questions_query, (quiz_id,), fetch_all=True)
        
        return jsonify({
            'attempt_id': attempt_id,
            'quiz_title': quiz['title'],
            'duration_minutes': quiz['duration_minutes'],
            'total_marks': quiz['total_marks'],
            'questions': questions
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/quiz/submit/<int:attempt_id>', methods=['POST'])
@token_required
@role_required(['student'])
def submit_quiz(current_user, attempt_id):
    """
    Submit quiz answers.
    
    Request Body:
        {
            "answers": [
                {"question_id": 1, "selected_answer": "b"},
                {"question_id": 2, "selected_answer": "a"}
            ]
        }
    
    Response:
        {
            "message": "Quiz submitted successfully",
            "score": 8.5,
            "total_marks": 10.0,
            "percentage": 85.0
        }
    """
    try:
        data = request.get_json()
        
        # Validate
        is_valid, missing = validate_required_fields(data, ['answers'])
        if not is_valid:
            return jsonify({'error': 'Missing answers'}), 400
        
        answers = data['answers']
        
        # Verify attempt belongs to student
        verify_query = """
            SELECT quiz_id FROM quiz_attempts
            WHERE id = %s AND student_id = %s
        """
        attempt = Database.execute_query(
            verify_query,
            (attempt_id, current_user['id']),
            fetch_one=True
        )
        
        if not attempt:
            return jsonify({'error': 'Attempt not found'}), 404
        
        quiz_id = attempt['quiz_id']
        
        # Get correct answers
        correct_query = """
            SELECT id, correct_answer, marks
            FROM quiz_questions
            WHERE quiz_id = %s
        """
        correct_answers = Database.execute_query(
            correct_query,
            (quiz_id,),
            fetch_all=True
        )
        
        # Create lookup dictionary
        correct_dict = {q['id']: q for q in correct_answers}
        
        # Calculate score and save answers
        total_score = 0.0
        
        for answer in answers:
            question_id = answer['question_id']
            selected = answer['selected_answer']
            
            if question_id not in correct_dict:
                continue
            
            correct_answer = correct_dict[question_id]['correct_answer']
            marks = correct_dict[question_id]['marks']
            is_correct = (selected == correct_answer)
            
            if is_correct:
                total_score += marks
            
            # Save answer
            save_query = """
                INSERT INTO quiz_answers 
                (attempt_id, question_id, selected_answer, is_correct)
                VALUES (%s, %s, %s, %s)
            """
            Database.execute_query(
                save_query,
                (attempt_id, question_id, selected, is_correct),
                commit=True
            )
        
        # Update attempt with score
        update_query = """
            UPDATE quiz_attempts
            SET score = %s, submitted_at = NOW()
            WHERE id = %s
        """
        Database.execute_query(
            update_query,
            (total_score, attempt_id),
            commit=True
        )
        
        # Get total marks
        total_marks = sum(q['marks'] for q in correct_answers)
        percentage = calculate_percentage(total_score, total_marks)
        
        return jsonify({
            'message': 'Quiz submitted successfully',
            'score': total_score,
            'total_marks': total_marks,
            'percentage': percentage
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@student_bp.route('/quiz/result/<int:attempt_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_quiz_result(current_user, attempt_id):
    """
    Get quiz result with detailed answers.
    
    Response:
        {
            "quiz_title": "Binary Search Tree Quiz",
            "score": 8.5,
            "total_marks": 10.0,
            "percentage": 85.0,
            "submitted_at": "2024-03-01 16:45:00",
            "answers": [...]
        }
    """
    try:
        # Get attempt info
        attempt_query = """
            SELECT qa.score, qa.total_marks, qa.submitted_at, q.title as quiz_title
            FROM quiz_attempts qa
            INNER JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.id = %s AND qa.student_id = %s
        """
        attempt = Database.execute_query(
            attempt_query,
            (attempt_id, current_user['id']),
            fetch_one=True
        )
        
        if not attempt:
            return jsonify({'error': 'Result not found'}), 404
        
        # Get detailed answers
        answers_query = """
            SELECT 
                qq.question_text,
                qq.option_a,
                qq.option_b,
                qq.option_c,
                qq.option_d,
                qq.correct_answer,
                qa.selected_answer,
                qa.is_correct,
                qq.marks
            FROM quiz_answers qa
            INNER JOIN quiz_questions qq ON qa.question_id = qq.id
            WHERE qa.attempt_id = %s
        """
        answers = Database.execute_query(answers_query, (attempt_id,), fetch_all=True)
        
        # Format data
        for answer in answers:
            answer['is_correct'] = bool(answer['is_correct'])
        
        percentage = calculate_percentage(attempt['score'], attempt['total_marks'])
        
        return jsonify({
            'quiz_title': attempt['quiz_title'],
            'score': attempt['score'],
            'total_marks': attempt['total_marks'],
            'percentage': percentage,
            'submitted_at': format_datetime(attempt['submitted_at']),
            'answers': answers
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== PERFORMANCE DASHBOARD ====================

@student_bp.route('/performance/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_my_performance(current_user, lab_id):
    """
    Get student's own performance dashboard.
    
    Response:
        {
            "attendance_percentage": 85.0,
            "avg_viva_marks": 8.2,
            "submission_rate": 90.0,
            "avg_quiz_score": 7.5,
            "overall_score": 82.8
        }
    """
    try:
        from app.services.performance_service import PerformanceService
        
        performance = PerformanceService.calculate_student_performance(
            current_user['id'],
            lab_id
        )
        
        return jsonify(performance), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== CALENDAR VIEW ====================

@student_bp.route('/calendar/<int:lab_id>', methods=['GET'])
@token_required
@role_required(['student'])
def get_lab_calendar(current_user, lab_id):
    """
    Get calendar view of lab sessions.
    
    Query Parameters:
        month: str (YYYY-MM) - optional
    
    Response:
        {
            "month": "2024-03",
            "sessions": [
                {
                    "date": "2024-03-01",
                    "experiment_title": "Binary Search Tree",
                    "attended": true,
                    "record_submitted": true,
                    "quiz_attempted": false
                }
            ]
        }
    """
    try:
        month = request.args.get('month', datetime.now().strftime('%Y-%m'))
        
        query = """
            SELECT 
                e.experiment_date as date,
                e.title as experiment_title,
                a.id IS NOT NULL as attended,
                s.id IS NOT NULL as record_submitted,
                qa.id IS NOT NULL as quiz_attempted
            FROM experiments e
            LEFT JOIN attendance a ON e.id = a.experiment_id 
                AND a.student_id = %s
            LEFT JOIN submissions s ON e.id = s.experiment_id 
                AND s.student_id = %s
            LEFT JOIN quizzes q ON e.id = q.experiment_id
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id 
                AND qa.student_id = %s
            WHERE e.lab_id = %s
            AND DATE_FORMAT(e.experiment_date, '%%Y-%%m') = %s
            ORDER BY e.experiment_date
        """
        sessions = Database.execute_query(
            query,
            (current_user['id'], current_user['id'], current_user['id'], lab_id, month),
            fetch_all=True
        )
        
        # Format data
        for session in sessions:
            session['date'] = str(session['date'])
            session['attended'] = bool(session['attended'])
            session['record_submitted'] = bool(session['record_submitted'])
            session['quiz_attempted'] = bool(session['quiz_attempted'])
        
        return jsonify({
            'month': month,
            'sessions': sessions
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500