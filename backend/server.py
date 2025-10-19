from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import secrets
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="MockME API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================
# MODELS
# ===================

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserSignup(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    passwordHash: str
    verified: bool = False
    purchasedTests: List[str] = []
    stats: Dict[str, Any] = {}
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    lastActiveAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    role: str = "student"  # student or admin
    twoFactorSecret: Optional[str] = None

class TokenResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class VerifyEmail(BaseModel):
    token: str

class ResetPassword(BaseModel):
    email: EmailStr

class UpdatePassword(BaseModel):
    token: str
    newPassword: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class Verify2FA(BaseModel):
    email: EmailStr
    code: str

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    testId: str
    text: str
    options: List[str]
    correctAnswer: Any  # int for MCQ, List[int] for MSQ
    explanation: str = ""
    questionType: str = "MCQ"  # MCQ or MSQ
    marks: float = 1.0
    negativeMarks: float = 0.33

class Test(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subject: str  # BT, CE, CS, etc.
    type: str  # mock or previousPaper
    duration: int  # minutes
    questions: List[str] = []  # question IDs
    rules: Dict[str, Any] = {}
    price: float = 30.0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    examType: str  # GATE or CAT

class TestCreate(BaseModel):
    title: str
    subject: str
    type: str
    duration: int
    rules: Dict[str, Any] = {}
    price: float = 30.0
    examType: str
    questions: List[Dict[str, Any]] = []

class Answer(BaseModel):
    qId: str
    chosen: Any  # int or List[int]

class SubmitTest(BaseModel):
    answers: List[Answer]
    timeSpent: int

class Attempt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    testId: str
    answers: List[Dict[str, Any]]
    score: float
    accuracy: float
    timeData: Dict[str, Any]
    percentile: float = 0.0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discountType: str  # percent or flat
    value: float
    expiry: str
    maxUses: int
    usedCount: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CouponCreate(BaseModel):
    code: str
    discountType: str
    value: float
    expiry: str
    maxUses: int

class ValidateCoupon(BaseModel):
    code: str

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    testId: Optional[str] = None
    amount: float
    couponApplied: Optional[str] = None
    status: str = "pending"  # pending, success, failed
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InitiatePurchase(BaseModel):
    testId: Optional[str] = None
    bundle: Optional[int] = None  # number of tests in bundle
    coupon: Optional[str] = None

class ConfirmPayment(BaseModel):
    paymentToken: str

class AdminSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    upiId: str = "mockme@upi"
    paymentMode: str = "mock"  # mock or live
    theme: str = "light"
    dataRetentionMonths: int = 12
    emailProvider: str = "resend"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AIExplain(BaseModel):
    questionId: str
    userAnswer: Any

# ===================
# HELPER FUNCTIONS
# ===================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

def generate_2fa_code() -> str:
    return ''.join(random.choices(string.digits, k=6))

async def send_email_mock(to: str, subject: str, body: str):
    logger.info(f"Mock email sent to {to}: {subject}")
    logger.info(f"Email body: {body}")

# ===================
# AUTH ROUTES
# ===================

@api_router.post("/auth/signup", response_model=Dict[str, str])
async def signup(user_data: UserSignup, background_tasks: BackgroundTasks):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        passwordHash=hash_password(user_data.password)
    )
    
    verification_token = generate_verification_token()
    await db.verification_tokens.insert_one({
        "token": verification_token,
        "email": user.email,
        "createdAt": datetime.now(timezone.utc).isoformat()
    })
    
    await db.users.insert_one(user.model_dump())
    
    background_tasks.add_task(
        send_email_mock,
        user.email,
        "Verify your email",
        f"Click here to verify: http://localhost:3000/verify-email?token={verification_token}"
    )
    
    return {"message": "User registered. Please check your email for verification."}

@api_router.post("/auth/verify-email", response_model=Dict[str, str])
async def verify_email(data: VerifyEmail):
    token_doc = await db.verification_tokens.find_one({"token": data.token})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    await db.users.update_one(
        {"email": token_doc["email"]},
        {"$set": {"verified": True}}
    )
    
    await db.verification_tokens.delete_one({"token": data.token})
    
    return {"message": "Email verified successfully"}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("verified", False):
        raise HTTPException(status_code=401, detail="Email not verified")
    
    token = create_token({"user_id": user["id"]})
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"lastActiveAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "student")
        }
    }

@api_router.post("/auth/reset-password", response_model=Dict[str, str])
async def reset_password(data: ResetPassword, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        return {"message": "If email exists, reset link will be sent"}
    
    reset_token = generate_verification_token()
    await db.reset_tokens.insert_one({
        "token": reset_token,
        "email": data.email,
        "createdAt": datetime.now(timezone.utc).isoformat()
    })
    
    background_tasks.add_task(
        send_email_mock,
        data.email,
        "Reset your password",
        f"Click here to reset: http://localhost:3000/reset-password?token={reset_token}"
    )
    
    return {"message": "If email exists, reset link will be sent"}

@api_router.put("/auth/update-password", response_model=Dict[str, str])
async def update_password(data: UpdatePassword):
    token_doc = await db.reset_tokens.find_one({"token": data.token})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    await db.users.update_one(
        {"email": token_doc["email"]},
        {"$set": {"passwordHash": hash_password(data.newPassword)}}
    )
    
    await db.reset_tokens.delete_one({"token": data.token})
    
    return {"message": "Password updated successfully"}

@api_router.post("/auth/admin-login", response_model=Dict[str, str])
async def admin_login(credentials: AdminLogin, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    code = generate_2fa_code()
    await db.twofa_codes.insert_one({
        "code": code,
        "email": credentials.email,
        "createdAt": datetime.now(timezone.utc).isoformat()
    })
    
    background_tasks.add_task(
        send_email_mock,
        credentials.email,
        "Your 2FA Code",
        f"Your verification code is: {code}"
    )
    
    return {"message": "2FA code sent to your email"}

@api_router.post("/auth/verify-2fa", response_model=TokenResponse)
async def verify_2fa(data: Verify2FA):
    code_doc = await db.twofa_codes.find_one({"email": data.email, "code": data.code})
    if not code_doc:
        raise HTTPException(status_code=401, detail="Invalid code")
    
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    token = create_token({"user_id": user["id"]})
    
    await db.twofa_codes.delete_one({"email": data.email, "code": data.code})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

# ===================
# TEST ROUTES
# ===================

@api_router.get("/tests", response_model=List[Dict[str, Any]])
async def get_tests(examType: Optional[str] = None, type: Optional[str] = None):
    query = {}
    if examType:
        query["examType"] = examType
    if type:
        query["type"] = type
    
    tests = await db.tests.find(query, {"_id": 0, "questions": 0}).to_list(1000)
    return tests

@api_router.get("/tests/{test_id}", response_model=Dict[str, Any])
async def get_test(test_id: str, user: dict = Depends(get_current_user)):
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test_id not in user.get("purchasedTests", []):
        test_copy = test.copy()
        test_copy["questions"] = []
        test_copy["locked"] = True
        return test_copy
    
    questions = await db.questions.find(
        {"id": {"$in": test["questions"]}},
        {"_id": 0, "correctAnswer": 0, "explanation": 0}
    ).to_list(1000)
    
    test["questions"] = questions
    test["locked"] = False
    return test

@api_router.post("/tests/start/{test_id}", response_model=Dict[str, Any])
async def start_test(test_id: str, user: dict = Depends(get_current_user)):
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test_id not in user.get("purchasedTests", []):
        raise HTTPException(status_code=403, detail="Test not purchased")
    
    return {"message": "Test started", "testId": test_id, "duration": test["duration"]}

@api_router.post("/tests/submit/{test_id}", response_model=Dict[str, Any])
async def submit_test(test_id: str, submission: SubmitTest, user: dict = Depends(get_current_user)):
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    questions = await db.questions.find(
        {"id": {"$in": test["questions"]}},
        {"_id": 0}
    ).to_list(1000)
    
    question_map = {q["id"]: q for q in questions}
    
    score = 0
    correct = 0
    total = len(questions)
    
    for ans in submission.answers:
        q = question_map.get(ans.qId)
        if not q:
            continue
        
        if q["questionType"] == "MSQ":
            if set(ans.chosen) == set(q["correctAnswer"]):
                score += q["marks"]
                correct += 1
        else:
            if ans.chosen == q["correctAnswer"]:
                score += q["marks"]
                correct += 1
            elif ans.chosen is not None:
                score -= q["negativeMarks"]
    
    accuracy = correct / total if total > 0 else 0
    
    all_attempts = await db.attempts.find({"testId": test_id}, {"_id": 0, "score": 1}).to_list(10000)
    scores = [a["score"] for a in all_attempts]
    scores.append(score)
    scores.sort()
    percentile = (scores.index(score) / len(scores)) * 100 if scores else 0
    
    attempt = Attempt(
        userId=user["id"],
        testId=test_id,
        answers=[ans.model_dump() for ans in submission.answers],
        score=score,
        accuracy=accuracy,
        timeData={"totalTime": submission.timeSpent},
        percentile=percentile
    )
    
    await db.attempts.insert_one(attempt.model_dump())
    
    return {
        "score": score,
        "percentile": round(percentile, 2),
        "accuracy": round(accuracy, 2),
        "aiAvailable": True,
        "attemptId": attempt.id
    }

@api_router.get("/tests/results/{attempt_id}", response_model=Dict[str, Any])
async def get_result(attempt_id: str, user: dict = Depends(get_current_user)):
    attempt = await db.attempts.find_one({"id": attempt_id}, {"_id": 0})
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt["userId"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    test = await db.tests.find_one({"id": attempt["testId"]}, {"_id": 0})
    questions = await db.questions.find(
        {"id": {"$in": test["questions"]}},
        {"_id": 0}
    ).to_list(1000)
    
    return {
        **attempt,
        "test": test,
        "questions": questions
    }

# ===================
# PURCHASE ROUTES
# ===================

@api_router.post("/purchases/initiate", response_model=Dict[str, Any])
async def initiate_purchase(data: InitiatePurchase, user: dict = Depends(get_current_user)):
    price = 0
    test_ids = []
    
    if data.testId:
        test = await db.tests.find_one({"id": data.testId}, {"_id": 0})
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        price = test.get("price", 30.0)
        test_ids = [data.testId]
    elif data.bundle:
        price = 100.0 if data.bundle == 5 else data.bundle * 30.0
    
    discount = 0
    if data.coupon:
        coupon = await db.coupons.find_one({"code": data.coupon}, {"_id": 0})
        if coupon and coupon["usedCount"] < coupon["maxUses"]:
            expiry = datetime.fromisoformat(coupon["expiry"])
            if expiry > datetime.now(timezone.utc):
                if coupon["discountType"] == "percent":
                    discount = price * (coupon["value"] / 100)
                else:
                    discount = coupon["value"]
    
    final_amount = max(0, price - discount)
    payment_token = str(uuid.uuid4())
    
    payment = Payment(
        userId=user["id"],
        testId=data.testId,
        amount=final_amount,
        couponApplied=data.coupon,
        status="pending"
    )
    
    await db.payments.insert_one(payment.model_dump())
    await db.payment_tokens.insert_one({
        "token": payment_token,
        "paymentId": payment.id,
        "createdAt": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "price": price,
        "discountApplied": discount,
        "finalAmount": final_amount,
        "paymentToken": payment_token
    }

@api_router.post("/purchases/confirm", response_model=Dict[str, str])
async def confirm_purchase(data: ConfirmPayment, user: dict = Depends(get_current_user)):
    token_doc = await db.payment_tokens.find_one({"token": data.paymentToken})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid payment token")
    
    payment = await db.payments.find_one({"id": token_doc["paymentId"]}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one(
        {"id": payment["id"]},
        {"$set": {"status": "success", "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    if payment.get("testId"):
        await db.users.update_one(
            {"id": user["id"]},
            {"$addToSet": {"purchasedTests": payment["testId"]}}
        )
    
    if payment.get("couponApplied"):
        await db.coupons.update_one(
            {"code": payment["couponApplied"]},
            {"$inc": {"usedCount": 1}}
        )
    
    await db.payment_tokens.delete_one({"token": data.paymentToken})
    
    return {"message": "Purchase confirmed successfully"}

@api_router.get("/purchases/history", response_model=List[Dict[str, Any]])
async def get_purchase_history(user: dict = Depends(get_current_user)):
    payments = await db.payments.find(
        {"userId": user["id"], "status": "success"},
        {"_id": 0}
    ).to_list(1000)
    return payments

# ===================
# COUPON ROUTES
# ===================

@api_router.post("/coupons/validate", response_model=Dict[str, Any])
async def validate_coupon(data: ValidateCoupon, user: dict = Depends(get_current_user)):
    coupon = await db.coupons.find_one({"code": data.code}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    expiry = datetime.fromisoformat(coupon["expiry"])
    if expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon expired")
    
    if coupon["usedCount"] >= coupon["maxUses"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    return {"valid": True, **coupon}

# ===================
# AI ROUTES
# ===================

@api_router.post("/ai/explain", response_model=Dict[str, str])
async def ai_explain(data: AIExplain, user: dict = Depends(get_current_user)):
    question = await db.questions.find_one({"id": data.questionId}, {"_id": 0})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    explanation = question.get("explanation", "No explanation available.")
    
    if not explanation or explanation == "":
        explanation = f"The correct answer is {question['correctAnswer']}. "
        explanation += "This question requires understanding of the fundamental concepts. "
        explanation += "Review the related topics for better clarity."
    
    return {"explanation": explanation}

# ===================
# ANALYTICS ROUTES
# ===================

@api_router.get("/analytics/user", response_model=Dict[str, Any])
async def get_user_analytics(user: dict = Depends(get_current_user)):
    attempts = await db.attempts.find({"userId": user["id"]}, {"_id": 0}).to_list(1000)
    
    if not attempts:
        return {
            "averageScore": 0,
            "testsAttempted": 0,
            "accuracyTrend": [],
            "timeEfficiency": [],
            "bestScore": 0
        }
    
    scores = [a["score"] for a in attempts]
    accuracies = [a["accuracy"] for a in attempts]
    times = [a["timeData"].get("totalTime", 0) for a in attempts]
    
    return {
        "averageScore": round(sum(scores) / len(scores), 2),
        "testsAttempted": len(attempts),
        "accuracyTrend": [round(a, 2) for a in accuracies],
        "timeEfficiency": times,
        "bestScore": max(scores)
    }

# ===================
# ADMIN ROUTES
# ===================

@api_router.get("/admin/tests", response_model=List[Dict[str, Any]])
async def admin_get_tests(admin: dict = Depends(get_admin_user)):
    tests = await db.tests.find({}, {"_id": 0}).to_list(1000)
    return tests

@api_router.post("/admin/tests", response_model=Dict[str, str])
async def admin_create_test(test_data: TestCreate, admin: dict = Depends(get_admin_user)):
    test = Test(
        title=test_data.title,
        subject=test_data.subject,
        type=test_data.type,
        duration=test_data.duration,
        rules=test_data.rules,
        price=test_data.price,
        examType=test_data.examType
    )
    
    question_ids = []
    for q_data in test_data.questions:
        question = Question(
            testId=test.id,
            text=q_data["text"],
            options=q_data["options"],
            correctAnswer=q_data["correctAnswer"],
            explanation=q_data.get("explanation", ""),
            questionType=q_data.get("questionType", "MCQ"),
            marks=q_data.get("marks", 1.0),
            negativeMarks=q_data.get("negativeMarks", 0.33)
        )
        await db.questions.insert_one(question.model_dump())
        question_ids.append(question.id)
    
    test.questions = question_ids
    await db.tests.insert_one(test.model_dump())
    
    return {"message": "Test created successfully", "testId": test.id}

@api_router.put("/admin/tests/{test_id}", response_model=Dict[str, str])
async def admin_update_test(test_id: str, test_data: TestCreate, admin: dict = Depends(get_admin_user)):
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    await db.tests.update_one(
        {"id": test_id},
        {"$set": {
            "title": test_data.title,
            "subject": test_data.subject,
            "type": test_data.type,
            "duration": test_data.duration,
            "rules": test_data.rules,
            "price": test_data.price,
            "examType": test_data.examType,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Test updated successfully"}

@api_router.delete("/admin/tests/{test_id}", response_model=Dict[str, str])
async def admin_delete_test(test_id: str, admin: dict = Depends(get_admin_user)):
    await db.tests.delete_one({"id": test_id})
    await db.questions.delete_many({"testId": test_id})
    return {"message": "Test deleted successfully"}

@api_router.get("/admin/coupons", response_model=List[Dict[str, Any]])
async def admin_get_coupons(admin: dict = Depends(get_admin_user)):
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    return coupons

@api_router.post("/admin/coupons", response_model=Dict[str, str])
async def admin_create_coupon(coupon_data: CouponCreate, admin: dict = Depends(get_admin_user)):
    coupon = Coupon(**coupon_data.model_dump())
    await db.coupons.insert_one(coupon.model_dump())
    return {"message": "Coupon created successfully", "couponId": coupon.id}

@api_router.put("/admin/coupons/{coupon_id}", response_model=Dict[str, str])
async def admin_update_coupon(coupon_id: str, coupon_data: CouponCreate, admin: dict = Depends(get_admin_user)):
    await db.coupons.update_one(
        {"id": coupon_id},
        {"$set": {
            **coupon_data.model_dump(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Coupon updated successfully"}

@api_router.delete("/admin/coupons/{coupon_id}", response_model=Dict[str, str])
async def admin_delete_coupon(coupon_id: str, admin: dict = Depends(get_admin_user)):
    await db.coupons.delete_one({"id": coupon_id})
    return {"message": "Coupon deleted successfully"}

@api_router.get("/admin/analytics", response_model=Dict[str, Any])
async def admin_get_analytics(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0}).to_list(10000)
    payments = await db.payments.find({"status": "success"}, {"_id": 0}).to_list(10000)
    attempts = await db.attempts.find({}, {"_id": 0}).to_list(10000)
    tests = await db.tests.find({}, {"_id": 0}).to_list(1000)
    
    revenue = sum(p["amount"] for p in payments)
    
    test_attempts = {}
    for att in attempts:
        test_id = att["testId"]
        test_attempts[test_id] = test_attempts.get(test_id, 0) + 1
    
    top_tests = sorted(test_attempts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "activeUsers": len([u for u in users if u.get("role") == "student"]),
        "totalRevenue": revenue,
        "totalPurchases": len(payments),
        "totalAttempts": len(attempts),
        "topTests": top_tests,
        "totalTests": len(tests)
    }

@api_router.get("/admin/settings", response_model=AdminSettings)
async def admin_get_settings(admin: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        default_settings = AdminSettings()
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    return AdminSettings(**settings)

@api_router.put("/admin/settings", response_model=Dict[str, str])
async def admin_update_settings(settings_data: AdminSettings, admin: dict = Depends(get_admin_user)):
    settings_data.updatedAt = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": settings_data.model_dump()},
        upsert=True
    )
    return {"message": "Settings updated successfully"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
