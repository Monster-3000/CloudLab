from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, User, VirtualMachine, WarningNotification
import random
import uuid
from functools import wraps

api_bp = Blueprint('api', __name__)

# --- CUSTOM DECORATORS ---
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user or user.role != 'Administrator':
                return jsonify(message="Administrator privileges required."), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# --- AUTH ROUTES ---
@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400

    new_user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'User')
    )
    new_user.set_password(data['password'])

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing required fields'}), 400

    username_or_email = data['username']
    user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()
    login_type = data.get('type', 'user')
    
    if user and user.check_password(data['password']):
        if login_type == 'admin' and user.role != 'Administrator':
            return jsonify({'message': 'Access denied. Administrator privileges required.'}), 403
        if login_type == 'user' and user.role == 'Administrator':
            return jsonify({'message': 'Please use the Administrator login portal.'}), 403

        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200

    return jsonify({'message': 'Invalid username or password'}), 401

@api_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user:
        return jsonify(user.to_dict()), 200
    return jsonify({'message': 'User not found'}), 404

# --- ADMIN ROUTES (USER MANAGEMENT) ---
@api_bp.route('/users', methods=['GET'])
@admin_required()
def get_all_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@api_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if str(user_id) == str(current_user_id):
        return jsonify({'message': 'You cannot delete yourself.'}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    # Delete associated VMs
    VirtualMachine.query.filter_by(user_id=user_id).delete()
    # Delete associated Notifications
    WarningNotification.query.filter_by(user_id=user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200

@api_bp.route('/users/<int:user_id>/warnings', methods=['POST'])
@admin_required()
def send_warning(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({'message': 'Warning message is required'}), 400
        
    warning = WarningNotification(user_id=user_id, message=message)
    db.session.add(warning)
    db.session.commit()
    
    return jsonify({'message': 'Warning sent successfully', 'warning': warning.to_dict()}), 201

# --- USER NOTIFICATIONS ---
@api_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    warnings = WarningNotification.query.filter_by(user_id=current_user_id, is_read=False).order_by(WarningNotification.created_at.desc()).all()
    return jsonify([w.to_dict() for w in warnings]), 200

@api_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notif_id):
    current_user_id = get_jwt_identity()
    warning = WarningNotification.query.filter_by(id=notif_id, user_id=current_user_id).first()
    if not warning:
        return jsonify({'message': 'Notification not found'}), 404
        
    warning.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200

# --- SIMULATION ROUTES ---
@api_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required(optional=True)
def get_stats():
    vms = VirtualMachine.query.all()
    total_vms = len(vms)
    total_storage = sum([vm.storage_gb for vm in vms]) if vms else 0
    total_cost = sum([vm.monthly_cost for vm in vms]) if vms else 0
    
    network_traffic = f"{(total_vms * 0.45):.1f} TB" if total_vms > 0 else "0.0 TB"
    est_cost = f"${total_cost:.2f}"
    
    return jsonify({
        'total_vms': str(total_vms),
        'storage_usage': f"{total_storage} GB",
        'network_traffic': network_traffic,
        'estimated_cost': est_cost
    }), 200

@api_bp.route('/vms', methods=['GET'])
@jwt_required(optional=True)
def get_vms():
    vms = VirtualMachine.query.all()
    return jsonify([vm.to_dict() for vm in vms]), 200

@api_bp.route('/vms', methods=['POST'])
@jwt_required(optional=True)
def create_vm():
    data = request.get_json() or {}
    
    new_vm = VirtualMachine(
        name=data.get('name', f'vm-{str(uuid.uuid4())[:8]}'),
        instance_type=data.get('instance_type', 't3.micro'),
        monthly_cost=data.get('monthly_cost', 14.50),
        cpu_cores=data.get('cpu_cores', 2),
        ram_gb=data.get('ram_gb', 4),
        storage_gb=data.get('storage_gb', 20),
        os=data.get('os', 'Ubuntu 22.04'),
        region=data.get('region', 'us-east-1'),
        vendor=data.get('vendor', 'AWS'),
        ip_address=f"192.168.1.{random.randint(10, 255)}",
        user_id=None
    )
    db.session.add(new_vm)
    db.session.commit()
    
    return jsonify(new_vm.to_dict()), 201

@api_bp.route('/vms/<int:vm_id>', methods=['DELETE'])
@jwt_required(optional=True)
def delete_vm(vm_id):
    vm = VirtualMachine.query.get(vm_id)
    if not vm:
        return jsonify({'message': 'VM not found'}), 404
        
    db.session.delete(vm)
    db.session.commit()
    return jsonify({'message': 'VM deleted successfully'}), 200
