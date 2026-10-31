import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes import api_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app, origins=["*"]) # Allow all origins for development
    db.init_app(app)
    jwt = JWTManager(app)

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')

    # Create tables
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
