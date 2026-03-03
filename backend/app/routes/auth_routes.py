"""
Authentication routes for login and registration.
"""

from flask import Blueprint, request, jsonify
from app.models import User
from app.auth import Auth
from app.utils import validate_required_fields

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint.
    
    Request Body:
        {
            "college_id": "STU001",
            "password": "password123"
        }
    
    Response:
        {
            "message": "Login successful",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "user": {
                "id": 1,
                "college_id": "STU001",
                "name": "John Doe",
                "role": "student"
            }
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        is_valid, missing = validate_required_fields(data, ['college_id', 'password'])
        if not is_valid:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        college_id = data['college_id']
        password = data['password']
        
        # Find user by college ID
        user = User.find_by_college_id(college_id)
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        if not Auth.verify_password(password, user['password_hash']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = Auth.generate_token(user['id'], user['college_id'], user['role'])
        
        # Remove password hash from response
        user_data = {
            'id': user['id'],
            'college_id': user['college_id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    User registration endpoint (for testing purposes).
    
    Request Body:
        {
            "college_id": "STU004",
            "name": "New Student",
            "email": "new@student.toch.edu",
            "password": "password123",
            "role": "student"
        }
    
    Response:
        {
            "message": "User registered successfully",
            "user_id": 4
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['college_id', 'name', 'email', 'password', 'role']
        is_valid, missing = validate_required_fields(data, required_fields)
        if not is_valid:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        # Validate role
        if data['role'] not in ['teacher', 'student']:
            return jsonify({'error': 'Invalid role. Must be teacher or student'}), 400
        
        # Check if user already exists
        existing_user = User.find_by_college_id(data['college_id'])
        if existing_user:
            return jsonify({'error': 'User with this college ID already exists'}), 409
        
        # Hash password
        password_hash = Auth.hash_password(data['password'])
        
        # Create user
        user_id = User.create(
            data['college_id'],
            data['name'],
            data['email'],
            password_hash,
            data['role']
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/verify', methods=['GET'])
def verify_token():
    """
    Verify if token is valid.
    
    Headers:
        Authorization: Bearer <token>
    
    Response:
        {
            "valid": true,
            "user": {...}
        }
    """
    try:
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = Auth.decode_token(token)
        
        if not payload:
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 401
        
        user = User.find_by_id(payload['user_id'])
        
        if not user:
            return jsonify({'valid': False, 'error': 'User not found'}), 401
        
        user_data = {
            'id': user['id'],
            'college_id': user['college_id'],
            'name': user['name'],
            'role': user['role']
        }
        
        return jsonify({'valid': True, 'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500