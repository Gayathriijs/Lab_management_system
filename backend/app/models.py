"""
Database models and connection handler.
Provides database connectivity and helper functions for CRUD operations.
"""

import pymysql
from pymysql.cursors import DictCursor
from app.config import Config


class Database:
    """Database connection handler"""
    
    @staticmethod
    def get_connection():
        """
        Create and return a new database connection.
        
        Returns:
            pymysql.Connection: Database connection object
        """
        try:
            connection = pymysql.connect(
                host=Config.MYSQL_HOST,
                user=Config.MYSQL_USER,
                password=Config.MYSQL_PASSWORD,
                database=Config.MYSQL_DB,
                port=Config.MYSQL_PORT,
                cursorclass=DictCursor,  # Returns results as dictionaries
                autocommit=False  # Manual transaction control
            )
            return connection
        except pymysql.Error as e:
            print(f"Database connection error: {e}")
            raise
    
    @staticmethod
    def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
        """
        Execute a database query with error handling.
        
        Args:
            query (str): SQL query to execute
            params (tuple/dict): Query parameters
            fetch_one (bool): Return single row
            fetch_all (bool): Return all rows
            commit (bool): Commit transaction
            
        Returns:
            dict/list/int: Query result or last inserted ID
        """
        connection = None
        cursor = None
        
        try:
            connection = Database.get_connection()
            cursor = connection.cursor()
            
            cursor.execute(query, params or ())
            
            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall()
            else:
                result = cursor.lastrowid  # Return inserted ID
            
            if commit:
                connection.commit()
            
            return result
            
        except pymysql.Error as e:
            if connection:
                connection.rollback()
            print(f"Query execution error: {e}")
            raise
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


class User:
    """User model for database operations"""
    
    @staticmethod
    def find_by_college_id(college_id):
        """
        Find user by college ID.
        
        Args:
            college_id (str): College ID
            
        Returns:
            dict: User data or None
        """
        query = "SELECT * FROM users WHERE college_id = %s"
        return Database.execute_query(query, (college_id,), fetch_one=True)
    
    @staticmethod
    def find_by_id(user_id):
        """
        Find user by ID.
        
        Args:
            user_id (int): User ID
            
        Returns:
            dict: User data or None
        """
        query = "SELECT * FROM users WHERE id = %s"
        return Database.execute_query(query, (user_id,), fetch_one=True)
    
    @staticmethod
    def create(college_id, name, email, password_hash, role):
        """
        Create a new user.
        
        Args:
            college_id (str): College ID
            name (str): Full name
            email (str): Email address
            password_hash (str): Hashed password
            role (str): User role (teacher/student)
            
        Returns:
            int: New user ID
        """
        query = """
            INSERT INTO users (college_id, name, email, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
        """
        return Database.execute_query(
            query, 
            (college_id, name, email, password_hash, role),
            commit=True
        )


class Lab:
    """Lab model for database operations"""
    
    @staticmethod
    def get_labs_by_teacher(teacher_id):
        """Get all labs taught by a teacher"""
        query = "SELECT * FROM labs WHERE teacher_id = %s"
        return Database.execute_query(query, (teacher_id,), fetch_all=True)
    
    @staticmethod
    def get_labs_by_student(student_id):
        """Get all labs enrolled by a student"""
        query = """
            SELECT l.* FROM labs l
            INNER JOIN lab_enrollments le ON l.id = le.lab_id
            WHERE le.student_id = %s
        """
        return Database.execute_query(query, (student_id,), fetch_all=True)
    
    @staticmethod
    def get_by_id(lab_id):
        """Get lab by ID"""
        query = "SELECT * FROM labs WHERE id = %s"
        return Database.execute_query(query, (lab_id,), fetch_one=True)


class Experiment:
    """Experiment model for database operations"""
    
    @staticmethod
    def create(lab_id, title, description, file_path, experiment_date, created_by):
        """Create new experiment"""
        query = """
            INSERT INTO experiments (lab_id, title, description, file_path, experiment_date, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        return Database.execute_query(
            query,
            (lab_id, title, description, file_path, experiment_date, created_by),
            commit=True
        )
    
    @staticmethod
    def get_by_lab(lab_id):
        """Get all experiments for a lab"""
        query = "SELECT * FROM experiments WHERE lab_id = %s ORDER BY experiment_date DESC"
        return Database.execute_query(query, (lab_id,), fetch_all=True)
    
    @staticmethod
    def get_by_id(experiment_id):
        """Get experiment by ID"""
        query = "SELECT * FROM experiments WHERE id = %s"
        return Database.execute_query(query, (experiment_id,), fetch_one=True)

    @staticmethod
    def delete(experiment_id):
        """Delete experiment by ID"""
        query = "DELETE FROM experiments WHERE id = %s"
        return Database.execute_query(query, (experiment_id,), commit=True)


class Attendance:
    """Attendance model for database operations"""
    
    @staticmethod
    def check_in(student_id, lab_id, experiment_id=None):
        """Record student check-in"""
        query = """
            INSERT INTO attendance (student_id, lab_id, experiment_id, check_in_time, status)
            VALUES (%s, %s, %s, NOW(), 'present')
        """
        return Database.execute_query(
            query,
            (student_id, lab_id, experiment_id),
            commit=True
        )
    
    @staticmethod
    def check_out(attendance_id):
        """Record student check-out"""
        query = "UPDATE attendance SET check_out_time = NOW() WHERE id = %s"
        Database.execute_query(query, (attendance_id,), commit=True)
    
    @staticmethod
    def get_student_attendance(student_id, lab_id):
        """Get attendance records for a student in a lab"""
        query = """
            SELECT * FROM attendance 
            WHERE student_id = %s AND lab_id = %s
            ORDER BY check_in_time DESC
        """
        return Database.execute_query(query, (student_id, lab_id), fetch_all=True)