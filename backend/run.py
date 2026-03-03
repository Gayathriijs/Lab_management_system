"""
Application entry point.
Runs the Flask development server.
"""

from app import create_app
import os

# Create Flask app instance
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # Run development server
    # WARNING: Do not use in production! Use gunicorn or uwsgi instead
    app.run(
        host='0.0.0.0',  # Listen on all network interfaces
        port=5000,        # Port number
        debug=True        # Enable debug mode (auto-reload on code changes)
    )