"""
Utility functions for file handling, validation, and common operations.
"""

import os
from werkzeug.utils import secure_filename
from app.config import Config


def allowed_file(filename):
    """
    Check if file extension is allowed.
    
    Args:
        filename (str): File name
        
    Returns:
        bool: True if extension is allowed
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


def save_file(file, folder):
    """
    Save uploaded file to specified folder.
    
    Args:
        file: FileStorage object from Flask request
        folder (str): Destination folder path
        
    Returns:
        str: Relative URL path like /uploads/experiments/file.pdf, or None if failed
    """
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        # Add timestamp to avoid name conflicts
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{timestamp}{ext}"
        
        filepath = os.path.join(folder, filename)
        file.save(filepath)
        
        # Return a relative URL path so the frontend can use it directly
        relative = os.path.relpath(filepath, Config.UPLOAD_FOLDER)
        return '/uploads/' + relative.replace(os.sep, '/')
    
    return None


def normalize_file_path(file_path):
    """
    Normalise a stored file_path to a relative URL.
    Handles both old absolute paths and new relative /uploads/... paths.
    
    Args:
        file_path (str): Value from database
        
    Returns:
        str: Relative URL like /uploads/experiments/file.pdf
    """
    if not file_path:
        return None
    # Already a relative URL
    if file_path.startswith('/uploads/'):
        return file_path
    # Absolute path — extract everything from the 'uploads' folder onward
    normalised = file_path.replace('\\', '/')
    idx = normalised.find('/uploads/')
    if idx != -1:
        return normalised[idx:]
    # Fallback: just return as-is
    return file_path


def delete_file(filepath):
    """
    Delete file from filesystem.
    
    Args:
        filepath (str): Path to file
        
    Returns:
        bool: True if deleted successfully
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    return False


def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present in data.
    
    Args:
        data (dict): Request data
        required_fields (list): List of required field names
        
    Returns:
        tuple: (is_valid, missing_fields)
    """
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    
    return len(missing_fields) == 0, missing_fields


def format_datetime(dt):
    """
    Format datetime object to string.
    
    Args:
        dt (datetime): Datetime object
        
    Returns:
        str: Formatted datetime string
    """
    if dt:
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    return None


def calculate_percentage(part, total):
    """
    Calculate percentage with safe division.
    
    Args:
        part (float): Part value
        total (float): Total value
        
    Returns:
        float: Percentage (0-100)
    """
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)