"""
Seed hostel fees for existing students in Firestore.
Run: python seed_hostel_fees.py
"""
from config.firebase import get_db
from datetime import datetime

db = get_db()

HOSTEL_FEES_TEMPLATE = [
    {"fee_name": "Hostel Rent - April 2024",       "amount": 4500, "due_date": "2024-04-05", "category": "hostel"},
    {"fee_name": "Hostel Mess Fee - April 2024",    "amount": 3200, "due_date": "2024-04-05", "category": "hostel"},
    {"fee_name": "Hostel Security Deposit",         "amount": 10000, "due_date": "2024-03-01", "category": "hostel"},
]

def seed_hostel_fees():
    print("=" * 50)
    print("Seeding hostel fees for all students...")
    print("=" * 50)

    users_ref = db.collection("users").where("role", "==", "student").stream()
    students = list(users_ref)

    if not students:
        print("No students found. Register students first.")
        return

    for student in students:
        data = student.to_dict()
        uid = student.id
        name = data.get("name", "Unknown")

        # Check if hostel fees already exist
        existing = db.collection("fees").where("user_id", "==", uid).where("category", "==", "hostel").stream()
        if list(existing):
            print(f"  ⏭  {name} — hostel fees already exist, skipping")
            continue

        for fee_template in HOSTEL_FEES_TEMPLATE:
            import uuid
            fee_id = f"hos_{uuid.uuid4().hex[:8]}"
            db.collection("fees").document(fee_id).set({
                "fee_id": fee_id,
                "user_id": uid,
                "enrollment_no": data.get("enrollment_no", ""),
                "fee_name": fee_template["fee_name"],
                "amount": fee_template["amount"],
                "due_date": fee_template["due_date"],
                "status": "pending",
                "category": "hostel",
                "room": "A-204",
                "created_at": datetime.utcnow().isoformat(),
            })

        print(f"  ✅ {name} — {len(HOSTEL_FEES_TEMPLATE)} hostel fees added")

    print("=" * 50)
    print("🎉 Hostel fees seeded!")


if __name__ == "__main__":
    seed_hostel_fees()
