"""
Flask application factory.
Initializes the Flask app, registers blueprints, and configures CORS.
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from app.config import config, Config


def create_app(config_name='development'):
    """
    Create and configure Flask application.
    
    Args:
        config_name (str): Configuration environment name
        
    Returns:
        Flask: Configured Flask application
    """
    
    # Initialize Flask app
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize upload folders
    Config.init_app()
    
    # Enable CORS (Cross-Origin Resource Sharing)
    # This allows frontend apps from different domains to access the API
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # Change to specific domain in production
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints (route modules)
    from app.routes.auth_routes import auth_bp
    from app.routes.teacher_routes import teacher_bp
    from app.routes.student_routes import student_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(teacher_bp)
    app.register_blueprint(student_bp)
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Lab Management System API',
            'version': '1.0',
            'endpoints': {
                'auth': '/api/auth',
                'teacher': '/api/teacher',
                'student': '/api/student'
            }
        })
    
    # Health check route
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Access forbidden'}), 403

    # Serve uploaded files (syllabus, experiments, records, outputs)
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    return app