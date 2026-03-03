"""
Performance calculation service.
Handles complex performance metrics and aggregations.
"""

from app.models import Database
from app.utils import calculate_percentage


class PerformanceService:
    """Service for calculating student and class performance metrics"""
    
    @staticmethod
    def calculate_student_performance(student_id, lab_id):
        """
        Calculate comprehensive performance metrics for a student.
        
        Args:
            student_id (int): Student ID
            lab_id (int): Lab ID
            
        Returns:
            dict: Performance metrics
        """
        try:
            # Get student info
            student_query = """
                SELECT name, college_id FROM users WHERE id = %s
            """
            student = Database.execute_query(student_query, (student_id,), fetch_one=True)
            
            if not student:
                return None
            
            # 1. ATTENDANCE PERCENTAGE
            # Get total lab sessions
            total_sessions_query = """
                SELECT COUNT(DISTINCT DATE(check_in_time)) as total
                FROM attendance
                WHERE lab_id = %s
            """
            total_sessions_result = Database.execute_query(
                total_sessions_query, 
                (lab_id,), 
                fetch_one=True
            )
            total_sessions = total_sessions_result['total'] or 0
            
            # Get student attendance
            student_attendance_query = """
                SELECT COUNT(DISTINCT DATE(check_in_time)) as attended
                FROM attendance
                WHERE student_id = %s AND lab_id = %s
            """
            student_attendance_result = Database.execute_query(
                student_attendance_query,
                (student_id, lab_id),
                fetch_one=True
            )
            attended = student_attendance_result['attended'] or 0
            
            attendance_percentage = calculate_percentage(attended, total_sessions)
            
            # 2. AVERAGE VIVA MARKS
            viva_query = """
                SELECT 
                    AVG(marks) as avg_marks,
                    AVG(max_marks) as avg_max_marks,
                    COUNT(*) as total_vivas
                FROM viva_scores vs
                INNER JOIN experiments e ON vs.experiment_id = e.id
                WHERE vs.student_id = %s AND e.lab_id = %s
            """
            viva_result = Database.execute_query(
                viva_query,
                (student_id, lab_id),
                fetch_one=True
            )
            
            avg_viva_marks = float(viva_result['avg_marks'] or 0)
            avg_viva_max = float(viva_result['avg_max_marks'] or 10)
            total_vivas = viva_result['total_vivas'] or 0
            
            # Convert to percentage (out of 10)
            if avg_viva_max > 0:
                avg_viva_score = round((avg_viva_marks / avg_viva_max) * 10, 2)
            else:
                avg_viva_score = 0.0
            
            # 3. SUBMISSION RATE
            # Get total experiments
            total_experiments_query = """
                SELECT COUNT(*) as total
                FROM experiments
                WHERE lab_id = %s
            """
            total_exp_result = Database.execute_query(
                total_experiments_query,
                (lab_id,),
                fetch_one=True
            )
            total_experiments = total_exp_result['total'] or 0
            
            # Get submitted records
            submissions_query = """
                SELECT COUNT(*) as submitted
                FROM submissions s
                INNER JOIN experiments e ON s.experiment_id = e.id
                WHERE s.student_id = %s AND e.lab_id = %s
            """
            submissions_result = Database.execute_query(
                submissions_query,
                (student_id, lab_id),
                fetch_one=True
            )
            records_submitted = submissions_result['submitted'] or 0
            
            submission_rate = calculate_percentage(records_submitted, total_experiments)
            
            # 4. AVERAGE QUIZ SCORE
            quiz_query = """
                SELECT 
                    AVG(qa.score) as avg_score,
                    AVG(qa.total_marks) as avg_total,
                    COUNT(*) as quizzes_attempted
                FROM quiz_attempts qa
                INNER JOIN quizzes q ON qa.quiz_id = q.id
                INNER JOIN experiments e ON q.experiment_id = e.id
                WHERE qa.student_id = %s AND e.lab_id = %s
            """
            quiz_result = Database.execute_query(
                quiz_query,
                (student_id, lab_id),
                fetch_one=True
            )
            
            avg_quiz_score_raw = float(quiz_result['avg_score'] or 0)
            avg_quiz_total = float(quiz_result['avg_total'] or 10)
            quizzes_attempted = quiz_result['quizzes_attempted'] or 0
            
            # Convert to percentage (out of 10)
            if avg_quiz_total > 0:
                avg_quiz_score = round((avg_quiz_score_raw / avg_quiz_total) * 10, 2)
            else:
                avg_quiz_score = 0.0
            
            # 5. OVERALL PERFORMANCE SCORE
            # Weighted average: Attendance(30%) + Viva(25%) + Submission(20%) + Quiz(25%)
            overall_score = round(
                (attendance_percentage * 0.30) +
                (avg_viva_score * 2.5) +  # Convert to percentage: *10/100*25
                (submission_rate * 0.20) +
                (avg_quiz_score * 2.5),    # Convert to percentage: *10/100*25
                2
            )
            
            # 6. AVERAGE SUBMISSION MARKS
            submission_marks_query = """
                SELECT AVG(marks) as avg_marks
                FROM submissions s
                INNER JOIN experiments e ON s.experiment_id = e.id
                WHERE s.student_id = %s AND e.lab_id = %s 
                AND s.status = 'accepted'
            """
            submission_marks_result = Database.execute_query(
                submission_marks_query,
                (student_id, lab_id),
                fetch_one=True
            )
            avg_submission_marks = float(submission_marks_result['avg_marks'] or 0)
            
            # Compile performance data
            performance = {
                'student': {
                    'name': student['name'],
                    'college_id': student['college_id']
                },
                'attendance_percentage': attendance_percentage,
                'avg_viva_marks': avg_viva_score,
                'submission_rate': submission_rate,
                'avg_quiz_score': avg_quiz_score,
                'avg_submission_marks': round(avg_submission_marks, 2),
                'overall_score': overall_score,
                'details': {
                    'total_experiments': total_experiments,
                    'records_submitted': records_submitted,
                    'quizzes_attempted': quizzes_attempted,
                    'total_vivas': total_vivas,
                    'total_attendance': attended,
                    'total_sessions': total_sessions
                }
            }
            
            # Update performance summary table (cache)
            PerformanceService._update_performance_summary(
                student_id,
                lab_id,
                performance
            )
            
            return performance
            
        except Exception as e:
            print(f"Error calculating student performance: {e}")
            raise
    
    @staticmethod
    def _update_performance_summary(student_id, lab_id, performance):
        """
        Update cached performance summary in database.
        
        Args:
            student_id (int): Student ID
            lab_id (int): Lab ID
            performance (dict): Calculated performance metrics
        """
        try:
            query = """
                INSERT INTO performance_summary 
                (student_id, lab_id, attendance_percentage, avg_quiz_score, 
                 avg_viva_score, submission_rate, overall_score)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                attendance_percentage = VALUES(attendance_percentage),
                avg_quiz_score = VALUES(avg_quiz_score),
                avg_viva_score = VALUES(avg_viva_score),
                submission_rate = VALUES(submission_rate),
                overall_score = VALUES(overall_score),
                last_updated = NOW()
            """
            
            Database.execute_query(
                query,
                (
                    student_id,
                    lab_id,
                    performance['attendance_percentage'],
                    performance['avg_quiz_score'],
                    performance['avg_viva_marks'],
                    performance['submission_rate'],
                    performance['overall_score']
                ),
                commit=True
            )
            
        except Exception as e:
            print(f"Error updating performance summary: {e}")
    
    @staticmethod
    def calculate_class_performance(lab_id):
        """
        Calculate class-wide performance metrics.
        
        Args:
            lab_id (int): Lab ID
            
        Returns:
            dict: Class performance metrics
        """
        try:
            # Get lab info
            lab_query = "SELECT name FROM labs WHERE id = %s"
            lab = Database.execute_query(lab_query, (lab_id,), fetch_one=True)
            
            if not lab:
                return None
            
            # Get all enrolled students
            students_query = """
                SELECT student_id FROM lab_enrollments
                WHERE lab_id = %s
            """
            students = Database.execute_query(students_query, (lab_id,), fetch_all=True)
            total_students = len(students)
            
            if total_students == 0:
                return {
                    'lab_name': lab['name'],
                    'total_students': 0,
                    'class_average': {},
                    'top_performers': [],
                    'bottom_performers': []
                }
            
            # Calculate performance for each student
            student_performances = []
            
            for student in students:
                perf = PerformanceService.calculate_student_performance(
                    student['student_id'],
                    lab_id
                )
                if perf:
                    student_performances.append(perf)
            
            # Calculate class averages
            if student_performances:
                avg_attendance = sum(p['attendance_percentage'] for p in student_performances) / len(student_performances)
                avg_quiz = sum(p['avg_quiz_score'] for p in student_performances) / len(student_performances)
                avg_viva = sum(p['avg_viva_marks'] for p in student_performances) / len(student_performances)
                avg_submission = sum(p['submission_rate'] for p in student_performances) / len(student_performances)
                avg_overall = sum(p['overall_score'] for p in student_performances) / len(student_performances)
            else:
                avg_attendance = avg_quiz = avg_viva = avg_submission = avg_overall = 0.0
            
            # Sort by overall score
            student_performances.sort(key=lambda x: x['overall_score'], reverse=True)
            
            # Get top 5 and bottom 5 performers
            top_performers = student_performances[:5]
            bottom_performers = student_performances[-5:] if len(student_performances) > 5 else []
            
            # Format for response
            def format_performer(perf):
                return {
                    'student_name': perf['student']['name'],
                    'college_id': perf['student']['college_id'],
                    'overall_score': perf['overall_score'],
                    'attendance_percentage': perf['attendance_percentage']
                }
            
            return {
                'lab_name': lab['name'],
                'total_students': total_students,
                'class_average': {
                    'attendance_percentage': round(avg_attendance, 2),
                    'avg_quiz_score': round(avg_quiz, 2),
                    'avg_viva_score': round(avg_viva, 2),
                    'submission_rate': round(avg_submission, 2),
                    'overall_score': round(avg_overall, 2)
                },
                'top_performers': [format_performer(p) for p in top_performers],
                'bottom_performers': [format_performer(p) for p in bottom_performers]
            }
            
        except Exception as e:
            print(f"Error calculating class performance: {e}")
            raise
    
    @staticmethod
    def get_performance_trend(student_id, lab_id, period='monthly'):
        """
        Get performance trend over time.
        
        Args:
            student_id (int): Student ID
            lab_id (int): Lab ID
            period (str): 'weekly' or 'monthly'
            
        Returns:
            dict: Performance trend data
        """
        try:
            # This is a placeholder for trend analysis
            # You could implement time-series analysis here
            
            if period == 'monthly':
                query = """
                    SELECT 
                        DATE_FORMAT(e.experiment_date, '%Y-%m') as period,
                        AVG(s.marks) as avg_marks,
                        COUNT(DISTINCT a.id) as attendance_count
                    FROM experiments e
                    LEFT JOIN submissions s ON e.id = s.experiment_id AND s.student_id = %s
                    LEFT JOIN attendance a ON e.id = a.experiment_id AND a.student_id = %s
                    WHERE e.lab_id = %s
                    GROUP BY DATE_FORMAT(e.experiment_date, '%%Y-%%m')
                    ORDER BY period
                """
            else:  # weekly
                query = """
                    SELECT 
                        YEARWEEK(e.experiment_date) as period,
                        AVG(s.marks) as avg_marks,
                        COUNT(DISTINCT a.id) as attendance_count
                    FROM experiments e
                    LEFT JOIN submissions s ON e.id = s.experiment_id AND s.student_id = %s
                    LEFT JOIN attendance a ON e.id = a.experiment_id AND a.student_id = %s
                    WHERE e.lab_id = %s
                    GROUP BY YEARWEEK(e.experiment_date)
                    ORDER BY period
                """
            
            trend_data = Database.execute_query(
                query,
                (student_id, student_id, lab_id),
                fetch_all=True
            )
            
            # Format data
            for item in trend_data:
                item['avg_marks'] = round(float(item['avg_marks'] or 0), 2)
            
            return {
                'period': period,
                'trend': trend_data
            }
            
        except Exception as e:
            print(f"Error getting performance trend: {e}")
            raise