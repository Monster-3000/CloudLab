import os
import csv
from app import create_app
from models import db, User, VirtualMachine, WarningNotification, CatalogItem

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

        import random
        previous_prices_usd = [3.10, 7.60, 15.20, 30.40, 70.08, 112.32, 62.05, 99.28, 91.98, 147.16, 168.00, 734.40, 146.00]

        try:
            with open('data.csv', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    usd_price = row.get('illustrative_monthly_price_usd', '')
                    inr_price = row.get('illustrative_monthly_price_inr', '')
                    
                    if 'Variable' in usd_price or 'usage-dependent' in usd_price:
                        random_price = random.choice(previous_prices_usd)
                        usd_price = f"~${random_price:.2f}"
                        inr_price = f"~₹{int(random_price * 83.33)}"

                    item = CatalogItem(
                        aws_service_name=row.get('aws_service_name'),
                        category=row.get('category'),
                        pricing_model=row.get('pricing_model'),
                        illustrative_monthly_price_usd=usd_price,
                        illustrative_monthly_price_inr=inr_price,
                        monthly_price_example_or_basis=row.get('monthly_price_example_or_basis'),
                        official_pricing_url=row.get('official_pricing_url'),
                        notes=row.get('notes'),
                        currency_conversion_assumption=row.get('currency_conversion_assumption'),
                        pricing_checked_date=row.get('pricing_checked_date'),
                        region_assumption=row.get('region_assumption'),
                        price_status=row.get('price_status')
                    )
                    db.session.add(item)
            db.session.commit()
            print("--> CSV Catalog seeded successfully!")
        except Exception as e:
            print(f"Error seeding CSV: {e}")

if __name__ == '__main__':
    seed_database()
