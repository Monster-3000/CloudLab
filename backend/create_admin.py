import os
from app import create_app
from models import db, User

app = create_app()

with app.app_context():
    existing_user = User.query.filter_by(username='admin').first()
    if not existing_user:
        new_user = User(username='admin', email='admin@cloudlab.local', role='Administrator')
        new_user.set_password('password')
        db.session.add(new_user)
        db.session.commit()
        print("Admin user created successfully! Username: admin | Password: password")
    else:
        print("Admin user already exists!")
