from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='User') # Admin/User

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role
        }

class VirtualMachine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    instance_type = db.Column(db.String(50), default='t3.micro')
    category = db.Column(db.String(50), default='General Purpose') # General Purpose, Compute, Memory, Storage, GPU, Database
    monthly_cost = db.Column(db.Float, default=14.50)
    hourly_cost = db.Column(db.Float, default=0.02)
    cpu_cores = db.Column(db.Integer, default=2)
    ram_gb = db.Column(db.Integer, default=4)
    storage_gb = db.Column(db.Integer, default=20)
    network_perf = db.Column(db.String(50), default='Up to 5 Gbps')
    architecture = db.Column(db.String(30), default='x86_64') # x86_64, ARM64 (Graviton3)
    os = db.Column(db.String(50), default='Ubuntu 22.04')
    region = db.Column(db.String(50), default='us-east-1')
    vendor = db.Column(db.String(50), default='AWS') # AWS, Azure, GCP
    status = db.Column(db.String(20), default='Running') # Running, Stopped, Terminated
    ip_address = db.Column(db.String(20), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Allow null for now
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'instance_type': self.instance_type,
            'category': self.category,
            'monthly_cost': self.monthly_cost,
            'hourly_cost': self.hourly_cost,
            'cpu_cores': self.cpu_cores,
            'ram_gb': self.ram_gb,
            'storage_gb': self.storage_gb,
            'network_perf': self.network_perf,
            'architecture': self.architecture,
            'os': self.os,
            'region': self.region,
            'vendor': self.vendor,
            'status': self.status,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat()
        }

class WarningNotification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }
