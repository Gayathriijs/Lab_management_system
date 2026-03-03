"""
Configuration file for the Flask application.
Contains database settings, JWT configuration, and file upload settings.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

class Config:
    """Base configuration class"""
    
    # Secret key for JWT encoding (CHANGE THIS IN PRODUCTION!)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-super-secret-key-change-in-production'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # Token valid for 24 hours
    JWT_ALGORITHM = 'HS256'
    
    # MySQL Database Configuration
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'your_password')
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'labsync_db'
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or 3306)
    
    # File Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max file size
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}
    
    # Folder structure for uploads
    SYLLABUS_FOLDER = os.path.join(UPLOAD_FOLDER, 'syllabus')
    EXPERIMENTS_FOLDER = os.path.join(UPLOAD_FOLDER, 'experiments')
    RECORDS_FOLDER = os.path.join(UPLOAD_FOLDER, 'records')
    OUTPUTS_FOLDER = os.path.join(UPLOAD_FOLDER, 'outputs')
    
    # Ensure upload folders exist
    @staticmethod
    def init_app():
        """Create necessary folders if they don't exist"""
        folders = [
            Config.UPLOAD_FOLDER,
            Config.SYLLABUS_FOLDER,
            Config.EXPERIMENTS_FOLDER,
            Config.RECORDS_FOLDER,
            Config.OUTPUTS_FOLDER
        ]
        for folder in folders:
            os.makedirs(folder, exist_ok=True)


class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing environment configuration"""
    TESTING = True
    MYSQL_DB = 'lab_management_test'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}