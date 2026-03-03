"""
Authentication and authorization module.
Handles JWT token generation, validation, and role-based access control.
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from app.config import Config
from app.models import User


class Auth:
    """Authentication handler"""
    
    @staticmethod
    def hash_password(password):
        """
        Hash a password using bcrypt.
        
        Args:
            password (str): Plain text password
            
        Returns:
            str: Hashed password
        """
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password, password_hash):
        """
        Verify a password against its hash.
        
        Args:
            password (str): Plain text password
            password_hash (str): Hashed password
            
        Returns:
            bool: True if password matches
        """
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def generate_token(user_id, college_id, role):
        """
        Generate JWT access token.
        
        Args:
            user_id (int): User ID
            college_id (str): College ID
            role (str): User role
            
        Returns:
            str: JWT token
        """
        payload = {
            'user_id': user_id,
            'college_id': college_id,
            'role': role,
            'exp': datetime.utcnow() + Config.JWT_ACCESS_TOKEN_EXPIRES,
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(
            payload,
            Config.JWT_SECRET_KEY,
            algorithm=Config.JWT_ALGORITHM
        )
        
        return token
    
    @staticmethod
    def decode_token(token):
        """
        Decode and verify JWT token.
        
        Args:
            token (str): JWT token
            
        Returns:
            dict: Decoded payload or None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=[Config.JWT_ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


def token_required(f):
    """
    Decorator to protect routes with JWT authentication.
    Extracts and validates token from Authorization header.
    
    Usage:
        @app.route('/protected')
        @token_required
        def protected_route(current_user):
            return jsonify({'user': current_user})
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Extract token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Decode and verify token
        payload = Auth.decode_token(token)
        
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Get current user from database
        current_user = User.find_by_id(payload['user_id'])
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        # Pass current_user to the route function
        return f(current_user, *args, **kwargs)
    
    return decorated


def role_required(allowed_roles):
    """
    Decorator to restrict routes by user role.
    
    Args:
        allowed_roles (list): List of allowed roles ['teacher', 'student']
    
    Usage:
        @app.route('/teacher-only')
        @token_required
        @role_required(['teacher'])
        def teacher_route(current_user):
            return jsonify({'message': 'Teacher only'})
    """
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user['role'] not in allowed_roles:
                return jsonify({'error': 'Access forbidden: insufficient permissions'}), 403
            
            return f(current_user, *args, **kwargs)
        
        return decorated
    return decorator