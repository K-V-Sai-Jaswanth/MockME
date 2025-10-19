import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["mockme_db"]
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "name": "Admin User",
        "email": "admin@mockme.com",
        "passwordHash": pwd_context.hash("admin123"),
        "verified": True,
        "purchasedTests": [],
        "stats": {},
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "lastActiveAt": datetime.now(timezone.utc).isoformat(),
        "role": "admin"
    }
    
    # Check if admin exists
    existing_admin = await db.users.find_one({"email": "admin@mockme.com"})
    if not existing_admin:
        await db.users.insert_one(admin_user)
        print("✓ Admin user created (email: admin@mockme.com, password: admin123)")
    
    # Sample GATE test
    gate_test_id = str(uuid.uuid4())
    gate_test = {
        "id": gate_test_id,
        "title": "GATE CS 2024 Mock Test 1",
        "subject": "Computer Science",
        "type": "mock",
        "duration": 180,
        "questions": [],
        "rules": {"mcq": True, "msq": True, "negativeMarking": True},
        "price": 30.0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "examType": "GATE"
    }
    
    # Sample questions for GATE
    gate_questions = [
        {
            "id": str(uuid.uuid4()),
            "testId": gate_test_id,
            "text": "What is the time complexity of binary search?",
            "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            "correctAnswer": 1,
            "explanation": "Binary search divides the search space in half with each iteration, resulting in O(log n) time complexity.",
            "questionType": "MCQ",
            "marks": 1.0,
            "negativeMarks": 0.33
        },
        {
            "id": str(uuid.uuid4()),
            "testId": gate_test_id,
            "text": "Which of the following are characteristics of a B-tree? (Select all that apply)",
            "options": ["Self-balancing", "Binary tree", "Multi-way tree", "Maintains sorted data"],
            "correctAnswer": [0, 2, 3],
            "explanation": "B-trees are self-balancing, multi-way trees that maintain sorted data. They are not binary trees.",
            "questionType": "MSQ",
            "marks": 2.0,
            "negativeMarks": 0.0
        },
        {
            "id": str(uuid.uuid4()),
            "testId": gate_test_id,
            "text": "Which sorting algorithm has the best average-case time complexity?",
            "options": ["Bubble Sort", "Quick Sort", "Selection Sort", "Insertion Sort"],
            "correctAnswer": 1,
            "explanation": "Quick Sort has an average-case time complexity of O(n log n), making it one of the most efficient sorting algorithms.",
            "questionType": "MCQ",
            "marks": 1.0,
            "negativeMarks": 0.33
        }
    ]
    
    question_ids = []
    for q in gate_questions:
        await db.questions.insert_one(q)
        question_ids.append(q["id"])
    
    gate_test["questions"] = question_ids
    await db.tests.insert_one(gate_test)
    print(f"✓ GATE test created with {len(gate_questions)} questions")
    
    # Sample CAT test
    cat_test_id = str(uuid.uuid4())
    cat_test = {
        "id": cat_test_id,
        "title": "CAT 2024 Mock Test 1",
        "subject": "Quantitative Aptitude",
        "type": "mock",
        "duration": 120,
        "questions": [],
        "rules": {"mcq": True, "negativeMarking": True},
        "price": 30.0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "examType": "CAT"
    }
    
    cat_questions = [
        {
            "id": str(uuid.uuid4()),
            "testId": cat_test_id,
            "text": "If x + 1/x = 5, what is the value of x² + 1/x²?",
            "options": ["23", "25", "27", "29"],
            "correctAnswer": 0,
            "explanation": "Using the identity (x + 1/x)² = x² + 2 + 1/x², we get 25 = x² + 2 + 1/x², so x² + 1/x² = 23.",
            "questionType": "MCQ",
            "marks": 3.0,
            "negativeMarks": 1.0
        },
        {
            "id": str(uuid.uuid4()),
            "testId": cat_test_id,
            "text": "What is 15% of 200?",
            "options": ["25", "30", "35", "40"],
            "correctAnswer": 1,
            "explanation": "15% of 200 = (15/100) × 200 = 30",
            "questionType": "MCQ",
            "marks": 3.0,
            "negativeMarks": 1.0
        }
    ]
    
    cat_question_ids = []
    for q in cat_questions:
        await db.questions.insert_one(q)
        cat_question_ids.append(q["id"])
    
    cat_test["questions"] = cat_question_ids
    await db.tests.insert_one(cat_test)
    print(f"✓ CAT test created with {len(cat_questions)} questions")
    
    # Sample coupon
    coupon = {
        "id": str(uuid.uuid4()),
        "code": "WELCOME20",
        "discountType": "percent",
        "value": 20,
        "expiry": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "maxUses": 100,
        "usedCount": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    await db.coupons.insert_one(coupon)
    print("✓ Sample coupon created (code: WELCOME20, 20% off)")
    
    print("\n✅ Database seeded successfully!")
    print("\n📝 Admin Login:")
    print("   Email: admin@mockme.com")
    print("   Password: admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
