"""
Database seed script - Creates test users and sample data
Run this ONCE after setting up the database schema
"""

import pymysql
import bcrypt
from datetime import datetime, timedelta

# Database config
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = '1234'
DB_NAME = 'labsync_db'
DB_PORT = 3306


def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def insert_test_data():
    try:
        # Connect to database
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        cursor = connection.cursor()
        
        print("🌱 Starting database seeding...")
        
        # ===== INSERT USERS =====
        print("\n[1/3] Inserting test users...")
        
        users_data = [
            ('STU001', 'John Doe', 'john@student.toch.edu', 'password123', 'student'),
            ('STU002', 'Jane Smith', 'jane@student.toch.edu', 'password123', 'student'),
            ('STU003', 'Bob Wilson', 'bob@student.toch.edu', 'password123', 'student'),
            ('TCH001', 'Dr. Rajesh Kumar', 'rajesh@teacher.toch.edu', 'password123', 'teacher'),
            ('TCH002', 'Dr. Priya Sharma', 'priya@teacher.toch.edu', 'password123', 'teacher'),
        ]
        
        user_ids = {}
        for college_id, name, email, password, role in users_data:
            password_hash = hash_password(password)
            sql = """
            INSERT INTO users (college_id, name, email, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (college_id, name, email, password_hash, role))
            user_ids[college_id] = cursor.lastrowid
            print(f"  ✓ Created {role.upper()}: {college_id} ({name})")
        
        connection.commit()
        
        # ===== INSERT LABS =====
        print("\n[2/3] Inserting labs...")
        
        labs_data = [
            ('Data Structures Lab', 'CSE201L', 3, user_ids['TCH001']),
            ('Web Development Lab', 'CSE301L', 4, user_ids['TCH002']),
            ('Database Lab', 'CSE302L', 4, user_ids['TCH001']),
        ]
        
        lab_ids = {}
        for name, code, semester, teacher_id in labs_data:
            sql = """
            INSERT INTO labs (name, code, semester, teacher_id)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (name, code, semester, teacher_id))
            lab_ids[code] = cursor.lastrowid
            print(f"  ✓ Created Lab: {code} - {name}")
        
        connection.commit()
        
        # ===== INSERT LAB ENROLLMENTS =====
        print("\n[3/3] Enrolling students in labs...")
        
        # Enroll all students in all labs
        student_ids = [user_ids['STU001'], user_ids['STU002'], user_ids['STU003']]
        lab_id_values = list(lab_ids.values())
        
        for lab_id in lab_id_values:
            for student_id in student_ids:
                sql = """
                INSERT INTO lab_enrollments (lab_id, student_id)
                VALUES (%s, %s)
                """
                try:
                    cursor.execute(sql, (lab_id, student_id))
                except:\
                    # Skip if enrollment already exists
                    pass
        
        connection.commit()
        print(f"  ✓ Enrolled {len(student_ids)} students in {len(lab_id_values)} labs")
        
        # ===== INSERT SAMPLE EXPERIMENTS =====
        print("\n[4/4] Creating sample experiments...")
        
        experiments_data = [
            (lab_ids['CSE201L'], 'Arrays and Linked Lists', 'Implement basic data structures', '2024-02-15', user_ids['TCH001']),
            (lab_ids['CSE201L'], 'Stacks and Queues', 'Implement stack and queue operations', '2024-02-22', user_ids['TCH001']),
            (lab_ids['CSE301L'], 'HTML & CSS Basics', 'Create a responsive webpage', '2024-02-15', user_ids['TCH002']),
        ]
        
        for lab_id, title, description, exp_date, created_by in experiments_data:
            sql = """
            INSERT INTO experiments (lab_id, title, description, experiment_date, created_by)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (lab_id, title, description, exp_date, created_by))
            print(f"  ✓ Created Experiment: {title}")
        
        connection.commit()
        
        print("\n✅ Database seeding completed successfully!")
        print("\n📋 TEST CREDENTIALS:")
        print("━" * 50)
        print("\nStudent Accounts:")
        print("  ID: STU001  | Password: password123")
        print("  ID: STU002  | Password: password123")
        print("  ID: STU003  | Password: password123")
        print("\nTeacher Accounts:")
        print("  ID: TCH001  | Password: password123")
        print("  ID: TCH002  | Password: password123")
        print("\n" + "━" * 50)
        
        cursor.close()
        connection.close()
        
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        if e.args[0] == 1062:  # Duplicate key error
            print("\n⚠️  Data already exists! Run seed_data.py only once.")
            print("💡 If you need to reseed, backup and delete the database first.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True


if __name__ == '__main__':
    insert_test_data()
