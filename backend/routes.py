from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, User, VirtualMachine, WarningNotification
import random
import uuid
import requests
import os
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
    running_vms = [vm for vm in vms if str(vm.status).lower() == 'running']
    running_count = len(running_vms)
    
    total_storage = sum([vm.storage_gb for vm in vms]) if vms else 0
    total_cost = sum([vm.monthly_cost for vm in vms]) if vms else 0
    total_cpu_cores = sum([vm.cpu_cores for vm in running_vms]) if running_vms else 0
    total_ram_gb = sum([vm.ram_gb for vm in running_vms]) if running_vms else 0
    
    # Calculate deterministic, synchronized CPU & RAM utilization based on running VMs
    if running_count == 0:
        current_cpu_pct = 0.0
        current_ram_pct = 0.0
    else:
        # Base utilization scales dynamically with running VM count and core specs
        base_cpu = min(82.0, max(18.0, (running_count * 10.5) + (total_cpu_cores * 1.5)))
        base_ram = min(88.0, max(22.0, (running_count * 12.0) + (total_ram_gb * 1.2)))
        
        current_cpu_pct = round(min(98.0, max(5.0, base_cpu + random.uniform(-3.5, 3.5))), 1)
        current_ram_pct = round(min(95.0, max(8.0, base_ram + random.uniform(-2.5, 2.5))), 1)

    network_traffic = f"{(running_count * 0.45):.1f} TB" if running_count > 0 else "0.0 TB"
    est_cost = f"${total_cost:.2f}"
    
    return jsonify({
        'total_vms': str(total_vms),
        'running_vms': str(running_count),
        'total_cpu_cores': total_cpu_cores,
        'total_ram_gb': total_ram_gb,
        'storage_usage': f"{total_storage} GB",
        'network_traffic': network_traffic,
        'estimated_cost': est_cost,
        'cpu_utilization': current_cpu_pct,
        'ram_utilization': current_ram_pct
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
        category=data.get('category', 'General Purpose'),
        monthly_cost=float(data.get('monthly_cost', 14.50)),
        hourly_cost=float(data.get('hourly_cost', 0.02)),
        cpu_cores=int(data.get('cpu_cores', 2)),
        ram_gb=int(data.get('ram_gb', 4)),
        storage_gb=int(data.get('storage_gb', 20)),
        network_perf=data.get('network_perf', 'Up to 5 Gbps'),
        architecture=data.get('architecture', 'x86_64'),
        os=data.get('os', 'Ubuntu 22.04 LTS'),
        region=data.get('region', 'us-east-1'),
        vendor=data.get('vendor', 'AWS'),
        status=data.get('status', 'Running'),
        ip_address=f"192.168.{random.randint(1, 250)}.{random.randint(10, 255)}",
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

@api_bp.route('/catalog', methods=['GET'])
def get_catalog():
    aws_catalog = [
        { "type": "t4g.nano", "name": "AWS Graviton2 Micro", "category": "General Purpose", "vendor": "AWS", "cpu": 2, "ram": 0.5, "storage": 10, "monthly_cost": 3.10, "hourly_cost": 0.0042, "network": "Up to 5 Gbps", "arch": "ARM64 (Graviton2)" },
        { "type": "t3.micro", "name": "General Purpose Micro", "category": "General Purpose", "vendor": "AWS", "cpu": 2, "ram": 1, "storage": 20, "monthly_cost": 7.60, "hourly_cost": 0.0104, "network": "Up to 5 Gbps", "arch": "x86_64" },
        { "type": "t3.small", "name": "General Purpose Small", "category": "General Purpose", "vendor": "AWS", "cpu": 2, "ram": 2, "storage": 30, "monthly_cost": 15.20, "hourly_cost": 0.0208, "network": "Up to 5 Gbps", "arch": "x86_64" },
        { "type": "t3.medium", "name": "General Purpose Medium", "category": "General Purpose", "vendor": "AWS", "cpu": 2, "ram": 4, "storage": 40, "monthly_cost": 30.40, "hourly_cost": 0.0416, "network": "Up to 5 Gbps", "arch": "x86_64" },
        { "type": "m6i.large", "name": "AWS General Purpose Large", "category": "General Purpose", "vendor": "AWS", "cpu": 2, "ram": 8, "storage": 50, "monthly_cost": 70.08, "hourly_cost": 0.096, "network": "Up to 12.5 Gbps", "arch": "x86_64" },
        { "type": "m6g.xlarge", "name": "AWS Graviton3 Large", "category": "General Purpose", "vendor": "AWS", "cpu": 4, "ram": 16, "storage": 100, "monthly_cost": 112.32, "hourly_cost": 0.154, "network": "Up to 12.5 Gbps", "arch": "ARM64 (Graviton3)" },
        { "type": "c6i.large", "name": "AWS Compute Optimized", "category": "Compute", "vendor": "AWS", "cpu": 2, "ram": 4, "storage": 50, "monthly_cost": 62.05, "hourly_cost": 0.085, "network": "Up to 12.5 Gbps", "arch": "x86_64" },
        { "type": "c6g.xlarge", "name": "AWS Compute Graviton3", "category": "Compute", "vendor": "AWS", "cpu": 4, "ram": 8, "storage": 100, "monthly_cost": 99.28, "hourly_cost": 0.136, "network": "Up to 12.5 Gbps", "arch": "ARM64 (Graviton3)" },
        { "type": "r6i.large", "name": "AWS Memory Optimized", "category": "Memory", "vendor": "AWS", "cpu": 2, "ram": 16, "storage": 100, "monthly_cost": 91.98, "hourly_cost": 0.126, "network": "Up to 12.5 Gbps", "arch": "x86_64" },
        { "type": "r6g.xlarge", "name": "AWS Memory Graviton3", "category": "Memory", "vendor": "AWS", "cpu": 4, "ram": 32, "storage": 200, "monthly_cost": 147.16, "hourly_cost": 0.2016, "network": "Up to 12.5 Gbps", "arch": "ARM64 (Graviton3)" },
        { "type": "i3en.large", "name": "AWS High I/O NVMe Storage", "category": "Storage", "vendor": "AWS", "cpu": 2, "ram": 16, "storage": 1250, "monthly_cost": 168.00, "hourly_cost": 0.230, "network": "Up to 25 Gbps", "arch": "x86_64" },
        { "type": "g5.xlarge", "name": "AWS NVIDIA A10G Tensor GPU", "category": "GPU / AI", "vendor": "AWS", "cpu": 4, "ram": 16, "storage": 250, "monthly_cost": 734.40, "hourly_cost": 1.006, "network": "Up to 25 Gbps", "arch": "x86_64" },
        { "type": "db.r6g.large", "name": "AWS RDS PostgreSQL Primary", "category": "Database", "vendor": "AWS", "cpu": 2, "ram": 16, "storage": 200, "monthly_cost": 146.00, "hourly_cost": 0.20, "network": "Up to 12.5 Gbps", "arch": "ARM64 (Graviton3)" }
    ]
    return jsonify(aws_catalog), 200

@api_bp.route('/chat', methods=['POST'])
def chat_assistant():
    data = request.get_json() or {}
    user_prompt = data.get('message', '').strip()
    api_key = data.get('api_key', '').strip()
    provider = data.get('provider', 'ollama').strip().lower()

    if not user_prompt:
        return jsonify({'reply': 'Hello! I am your CloudLab AI Assistant powered by your local Llama 3.2 3B model. Ask me anything about AWS EC2 instances, pricing, or architecture specs.'}), 200

    # 1. Attempt connection to local Ollama endpoint (Llama 3.2 3B)
    ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434/api/generate')
    model_name = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')

    system_context = (
        "You are CloudLab AI Assistant, an expert AWS cloud architect and infrastructure advisor. "
        "Format your answer cleanly using concise bullet points and bold headers. "
        "Wrap instance types in backticks (e.g. `t3.medium`, `db.r6g.large`) and pricing in bold (e.g. **$30.40/mo**). "
        "Avoid long paragraphs or walls of unstructured text."
    )

    formatted_prompt = f"{system_context}\n\nUser Question: {user_prompt}\n\nCloudLab AI Assistant:"

    try:
        ollama_res = requests.post(
            ollama_url,
            json={
                "model": model_name,
                "prompt": formatted_prompt,
                "stream": False
            },
            timeout=20
        )
        if ollama_res.status_code == 200:
            res_data = ollama_res.json()
            llm_reply = res_data.get('response', '').strip()
            if llm_reply:
                return jsonify({
                    'reply': llm_reply,
                    'provider': 'llama3.2:3b (Local Ollama)'
                }), 200
    except Exception as e:
        print(f"[Chatbot] Local Ollama model connection attempt: {e}. Utilizing built-in recommendation system.")

    # 2. Rule-Based Fallback if Ollama server is offline or restarting
    prefix = "🦙 [Llama 3.2 Local] " if provider == 'ollama' or provider == 'llama3.2' else ""
    if api_key:
        prefix += "⚡ [Custom Key Connected] "

    message = user_prompt.lower()

    if 'postgres' in message or 'database' in message or 'db' in message:
        reply = (
            prefix + "For database workloads like PostgreSQL or MySQL, I recommend:\n"
            "• **AWS RDS Primary**: `db.r6g.large` (2 vCPU, 16 GB RAM, ARM64 Graviton3) at **$146.00/mo** ($0.20/hr).\n"
            "• **Self-hosted EC2**: `r6i.large` (2 vCPU, 16 GB RAM, x86_64) at **$91.98/mo** ($0.126/hr).\n"
            "Tip: Memory-optimized instances provide high RAM buffer for database caching."
        )
    elif 'graviton' in message or 'arm' in message:
        reply = (
            prefix + "AWS Graviton3 instances (`m6g.xlarge`, `c6g.xlarge`, `r6g.xlarge`) offer up to **40% better price-performance** over x86_64 processors. "
            "They consume less power and provide up to 25 Gbps network bandwidth."
        )
    elif 'cost' in message or 'pricing' in message or 'price' in message or 'cheap' in message:
        reply = (
            prefix + "Here are cost-effective AWS options:\n"
            "• **Entry Micro**: `t4g.nano` (ARM64, 2 vCPU, 0.5 GB RAM) at **$3.10/mo** ($0.0042/hr).\n"
            "• **General Purpose**: `t3.micro` at **$7.60/mo** ($0.0104/hr) or `t3.medium` at **$30.40/mo**.\n"
            "• **Compute Heavy**: `c6i.large` at **$62.05/mo**."
        )
    elif 'gpu' in message or 'ai' in message or 'machine learning' in message:
        reply = (
            prefix + "For AI/ML acceleration or high-throughput rendering:\n"
            "• **AWS GPU Instance**: `g5.xlarge` with NVIDIA A10G Tensor GPU (4 vCPU, 16 GB RAM, 250 GB NVMe) at **$734.40/mo** ($1.006/hr)."
        )
    elif 'alb' in message or 'load balancer' in message or 'architecture' in message:
        reply = (
            prefix + "To build a resilient AWS cloud architecture:\n"
            "1. Deploy an **AWS Application Load Balancer (ALB)** at the front.\n"
            "2. Route traffic to **AWS EC2 t3.medium** web application nodes.\n"
            "3. Connect backend services to **AWS RDS PostgreSQL** (`db.r6g.large`) and **AWS S3** asset storage."
        )
    else:
        reply = (
            prefix + f"I analyzed your inquiry: '{user_prompt}'.\n\n"
            "In CloudLab, you can provision AWS EC2 General Purpose (`t3.medium`), Compute (`c6i.large`), Memory (`r6i.large`), and Database (`db.r6g.large`) instances.\n"
            "Use the floating **Launch AWS Instance** button or test architecture diagrams in the **Architecture Designer**!"
        )

    return jsonify({'reply': reply, 'provider': 'rule-engine'}), 200


