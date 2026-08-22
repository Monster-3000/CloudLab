import os
from app import create_app
from models import db, User, VirtualMachine, WarningNotification

def seed_database():
    app = create_app()
    with app.app_context():
        # Drop all and recreate clean database tables
        db.drop_all()
        db.create_all()

        print("--> Database tables created cleanly.")

        # Create Admin User
        admin = User(
            username='admin',
            email='admin@cloudlab.io',
            role='Administrator'
        )
        admin.set_password('password')
        db.session.add(admin)

        # Create Standard User
        demo_user = User(
            username='cloud_engineer',
            email='user@cloudlab.io',
            role='User'
        )
        demo_user.set_password('password')
        db.session.add(demo_user)
        db.session.commit()

        print(f"--> Users created: admin (id: {admin.id}), cloud_engineer (id: {demo_user.id})")

        # Initial realistic seed VMs (AWS & Multi-cloud instances)
        sample_vms = [
            VirtualMachine(
                name='aws-ec2-frontend-web-01',
                instance_type='t3.medium',
                category='General Purpose',
                monthly_cost=30.40,
                hourly_cost=0.0416,
                cpu_cores=2,
                ram_gb=4,
                storage_gb=40,
                network_perf='Up to 5 Gbps',
                architecture='x86_64',
                os='Ubuntu 22.04 LTS',
                region='us-east-1',
                vendor='AWS',
                status='Running',
                ip_address='54.208.14.82',
                user_id=demo_user.id
            ),
            VirtualMachine(
                name='aws-ec2-api-server-graviton',
                instance_type='m6g.xlarge',
                category='General Purpose',
                monthly_cost=112.32,
                hourly_cost=0.154,
                cpu_cores=4,
                ram_gb=16,
                storage_gb=100,
                network_perf='Up to 12.5 Gbps',
                architecture='ARM64 (Graviton3)',
                os='Amazon Linux 2023',
                region='us-east-1',
                vendor='AWS',
                status='Running',
                ip_address='3.86.112.19',
                user_id=demo_user.id
            ),
            VirtualMachine(
                name='aws-ec2-selfhosted-postgres',
                instance_type='r6i.large',
                category='Memory Optimized',
                monthly_cost=91.98,
                hourly_cost=0.126,
                cpu_cores=2,
                ram_gb=16,
                storage_gb=200,
                network_perf='Up to 12.5 Gbps',
                architecture='x86_64',
                os='Amazon Linux 2023',
                region='us-west-2',
                vendor='AWS',
                status='Running',
                ip_address='52.32.90.144',
                user_id=demo_user.id
            ),
            VirtualMachine(
                name='aws-ec2-batch-analytics-worker',
                instance_type='c6i.large',
                category='Compute Optimized',
                monthly_cost=62.05,
                hourly_cost=0.085,
                cpu_cores=2,
                ram_gb=4,
                storage_gb=50,
                network_perf='Up to 12.5 Gbps',
                architecture='x86_64',
                os='Ubuntu 22.04 LTS',
                region='eu-west-1',
                vendor='AWS',
                status='Stopped',
                ip_address='34.240.18.5',
                user_id=demo_user.id
            ),
            VirtualMachine(
                name='azure-vm-k8s-node-01',
                instance_type='Standard_D2s_v5',
                category='General Purpose',
                monthly_cost=70.00,
                hourly_cost=0.096,
                cpu_cores=2,
                ram_gb=8,
                storage_gb=64,
                network_perf='4 Gbps',
                architecture='x86_64',
                os='Ubuntu 22.04 LTS',
                region='eastus',
                vendor='Azure',
                status='Running',
                ip_address='20.120.45.10',
                user_id=demo_user.id
            ),
            VirtualMachine(
                name='gcp-vm-bigquery-connector',
                instance_type='n2-standard-4',
                category='General Purpose',
                monthly_cost=114.50,
                hourly_cost=0.156,
                cpu_cores=4,
                ram_gb=16,
                storage_gb=100,
                network_perf='10 Gbps',
                architecture='x86_64',
                os='Debian 12',
                region='us-central1',
                vendor='GCP',
                status='Running',
                ip_address='35.208.192.4',
                user_id=demo_user.id
            )
        ]

        for vm in sample_vms:
            db.session.add(vm)

        db.session.commit()
        print(f"--> {len(sample_vms)} realistic cloud instances seeded successfully!")

if __name__ == '__main__':
    seed_database()
