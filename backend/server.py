from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Query, Form
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import os
import logging
import uuid
import shutil
from pathlib import Path
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import tempfile
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    role: str = "user"
    full_name_ar: str
    full_name_en: str = ""
    avatar_url: str = ""
    company_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name_ar: str
    full_name_en: str = ""
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_ar: str
    name_en: str = ""
    logo_url: str = ""
    primary_color: str = "#D4AF37"
    secondary_color: str = "#334155"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CompanyCreate(BaseModel):
    name_ar: str
    name_en: str = ""
    logo_url: str = ""
    primary_color: str = "#D4AF37"
    secondary_color: str = "#334155"

class Case(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_number: str
    title_ar: str
    title_en: str = ""
    type: str
    court: str
    status: str = "active"
    priority: str = "medium"
    plaintiff: str
    defendant: str
    description_ar: str = ""
    company_id: str
    user_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CaseCreate(BaseModel):
    case_number: str
    title_ar: str
    title_en: str = ""
    type: str
    court: str
    priority: str = "medium"
    plaintiff: str
    defendant: str
    description_ar: str = ""

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    session_date: str
    session_time: str = ""
    location: str
    notes_ar: str = ""
    notes_en: str = ""
    status: str = "scheduled"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SessionCreate(BaseModel):
    case_id: str
    session_date: str
    session_time: str = ""
    location: str
    notes_ar: str = ""
    status: str = "scheduled"

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    title: str
    file_name: str
    file_path: str
    file_size: int
    gdrive_file_id: Optional[str] = None
    ocr_text: str = ""
    uploaded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    invoice_number: str
    type: str
    amount: float
    vat_amount: float = 0.0
    total_amount: float
    status: str = "pending"
    description_ar: str = ""
    issued_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    due_date: Optional[str] = None

class InvoiceCreate(BaseModel):
    case_id: str
    type: str
    amount: float
    vat_percentage: float = 5.0
    description_ar: str = ""
    due_date: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_id: str
    case_id: str
    amount: float
    payment_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    method: str = "cash"
    notes: str = ""

class PaymentCreate(BaseModel):
    invoice_id: str
    case_id: str
    amount: float
    method: str = "cash"
    notes: str = ""

class Template(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title_ar: str
    content_ar: str
    company_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TemplateCreate(BaseModel):
    type: str
    title_ar: str
    content_ar: str

class AIMessage(BaseModel):
    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AIConversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    case_id: Optional[str] = None
    messages: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AIRequest(BaseModel):
    message: str
    case_id: Optional[str] = None
    conversation_id: Optional[str] = None
    provider: str = "openai"
    model: str = "gpt-5.2"

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, os.getenv("JWT_SECRET"), algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        user_id = payload["user_id"]
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/")
async def root():
    return {"message": "LegalCore API is running", "status": "ok"}

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = pwd_context.hash(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=password_hash,
        full_name_ar=user_data.full_name_ar,
        full_name_en=user_data.full_name_en,
        role=user_data.role
    )
    
    doc = user.model_dump()
    await db.users.insert_one(doc)
    
    token = create_token(user.id, user.email, user.role)
    return {"token": token, "user": {"id": user.id, "email": user.email, "full_name_ar": user.full_name_ar, "role": user.role}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not pwd_context.verify(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    token = create_token(user.id, user.email, user.role)
    
    company = None
    if user.company_id:
        company_doc = await db.companies.find_one({"id": user.company_id}, {"_id": 0})
        if company_doc:
            company = Company(**company_doc)
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name_ar": user.full_name_ar,
            "full_name_en": user.full_name_en,
            "role": user.role,
            "avatar_url": user.avatar_url,
            "company_id": user.company_id
        },
        "company": company.model_dump() if company else None
    }

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    company = None
    if user.company_id:
        company_doc = await db.companies.find_one({"id": user.company_id}, {"_id": 0})
        if company_doc:
            company = Company(**company_doc)
    
    return {
        "user": user.model_dump(exclude={"password_hash"}),
        "company": company.model_dump() if company else None
    }

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["full_name_ar", "full_name_en", "avatar_url"]
    update_fields = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.users.update_one({"id": user_id}, {"$set": update_fields})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0})
    return User(**updated)

@api_router.post("/companies")
async def create_company(company_data: CompanyCreate, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create companies")
    
    company = Company(**company_data.model_dump())
    await db.companies.insert_one(company.model_dump())
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"company_id": company.id}}
    )
    
    return company

@api_router.put("/companies/{company_id}")
async def update_company(company_id: str, company_data: CompanyCreate, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update companies")
    
    await db.companies.update_one(
        {"id": company_id},
        {"$set": company_data.model_dump()}
    )
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    return Company(**updated)

@api_router.get("/cases", response_model=List[Case])
async def get_cases(user: User = Depends(get_current_user)):
    query = {}
    if user.role != "admin":
        query["user_id"] = user.id
    elif user.company_id:
        query["company_id"] = user.company_id
    
    cases = await db.cases.find(query, {"_id": 0}).to_list(1000)
    return [Case(**case) for case in cases]

@api_router.post("/cases")
async def create_case(case_data: CaseCreate, user: User = Depends(get_current_user)):
    case = Case(
        **case_data.model_dump(),
        company_id=user.company_id or "",
        user_id=user.id
    )
    await db.cases.insert_one(case.model_dump())
    return case

@api_router.get("/cases/{case_id}")
async def get_case(case_id: str, user: User = Depends(get_current_user)):
    case_doc = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")
    return Case(**case_doc)

@api_router.put("/cases/{case_id}")
async def update_case(case_id: str, case_data: CaseCreate, user: User = Depends(get_current_user)):
    await db.cases.update_one(
        {"id": case_id},
        {"$set": case_data.model_dump()}
    )
    updated = await db.cases.find_one({"id": case_id}, {"_id": 0})
    return Case(**updated)

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, user: User = Depends(get_current_user)):
    await db.cases.delete_one({"id": case_id})
    return {"message": "Case deleted"}

@api_router.get("/cases/{case_id}/sessions", response_model=List[Session])
async def get_sessions(case_id: str, user: User = Depends(get_current_user)):
    sessions = await db.sessions.find({"case_id": case_id}, {"_id": 0}).to_list(1000)
    return [Session(**session) for session in sessions]

@api_router.post("/sessions")
async def create_session(session_data: SessionCreate, user: User = Depends(get_current_user)):
    session = Session(**session_data.model_dump())
    await db.sessions.insert_one(session.model_dump())
    return session

@api_router.put("/sessions/{session_id}")
async def update_session(session_id: str, session_data: SessionCreate, user: User = Depends(get_current_user)):
    await db.sessions.update_one(
        {"id": session_id},
        {"$set": session_data.model_dump()}
    )
    updated = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    return Session(**updated)

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user: User = Depends(get_current_user)):
    await db.sessions.delete_one({"id": session_id})
    return {"message": "Session deleted"}

@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    case_id: str = Form(...),
    title: str = Form(...),
    user: User = Depends(get_current_user)
):
    try:
        file_id = str(uuid.uuid4())
        file_ext = Path(file.filename).suffix
        file_name = f"{file_id}{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        ocr_text = ""
        if file_ext.lower() in [".pdf", ".png", ".jpg", ".jpeg"]:
            try:
                if file_ext.lower() == ".pdf":
                    with tempfile.TemporaryDirectory() as temp_dir:
                        images = convert_from_path(str(file_path), output_folder=temp_dir)
                        for img in images:
                            ocr_text += pytesseract.image_to_string(img, lang="ara+eng") + "\n"
                else:
                    img = Image.open(file_path)
                    ocr_text = pytesseract.image_to_string(img, lang="ara+eng")
            except Exception as e:
                logger.warning(f"OCR failed: {e}")
        
        document = Document(
            case_id=case_id,
            title=title,
            file_name=file.filename,
            file_path=str(file_path),
            file_size=file_path.stat().st_size,
            ocr_text=ocr_text
        )
        
        await db.documents.insert_one(document.model_dump())
        return document
    
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/cases/{case_id}/documents", response_model=List[Document])
async def get_documents(case_id: str, user: User = Depends(get_current_user)):
    documents = await db.documents.find({"case_id": case_id}, {"_id": 0}).to_list(1000)
    return [Document(**doc) for doc in documents]

@api_router.get("/documents/search")
async def search_documents(
    q: str = Query(...),
    case_type: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    query = {"ocr_text": {"$regex": q, "$options": "i"}}
    
    if case_type:
        case_ids = await db.cases.find({"type": case_type}, {"_id": 0, "id": 1}).to_list(1000)
        query["case_id"] = {"$in": [c["id"] for c in case_ids]}
    
    documents = await db.documents.find(query, {"_id": 0}).to_list(100)
    return [Document(**doc) for doc in documents]

@api_router.get("/documents/{doc_id}/download")
async def download_document(doc_id: str, user: User = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(doc["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=doc["file_name"])

async def generate_invoice_number(invoice_type: str) -> str:
    year = datetime.now(timezone.utc).year
    prefix_map = {
        "fees": "FEES",
        "expenses": "EXP",
        "receipt": "RCPT",
        "credit_note": "CN",
        "debit_note": "DN"
    }
    prefix = prefix_map.get(invoice_type, "INV")
    
    last_invoice = await db.invoices.find_one(
        {"type": invoice_type, "invoice_number": {"$regex": f"^{prefix}-{year}"}},
        {"_id": 0, "invoice_number": 1},
        sort=[("created_at", -1)]
    )
    
    if last_invoice:
        last_num = int(last_invoice["invoice_number"].split("-")[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"{prefix}-{year}-{new_num:06d}"

@api_router.post("/invoices")
async def create_invoice(invoice_data: InvoiceCreate, user: User = Depends(get_current_user)):
    invoice_number = await generate_invoice_number(invoice_data.type)
    vat_amount = invoice_data.amount * (invoice_data.vat_percentage / 100)
    total_amount = invoice_data.amount + vat_amount
    
    invoice = Invoice(
        case_id=invoice_data.case_id,
        invoice_number=invoice_number,
        type=invoice_data.type,
        amount=invoice_data.amount,
        vat_amount=vat_amount,
        total_amount=total_amount,
        description_ar=invoice_data.description_ar,
        due_date=invoice_data.due_date
    )
    
    await db.invoices.insert_one(invoice.model_dump())
    return invoice

@api_router.get("/cases/{case_id}/invoices", response_model=List[Invoice])
async def get_invoices(case_id: str, user: User = Depends(get_current_user)):
    invoices = await db.invoices.find({"case_id": case_id}, {"_id": 0}).to_list(1000)
    return [Invoice(**inv) for inv in invoices]

@api_router.put("/invoices/{invoice_id}")
async def update_invoice_status(invoice_id: str, update_data: dict, user: User = Depends(get_current_user)):
    # Allow updating all fields or just status
    allowed_fields = ["status", "type", "amount", "vat_percentage", "description_ar", "due_date"]
    update_fields = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    # Recalculate totals if amount or vat changed
    if "amount" in update_fields or "vat_percentage" in update_fields:
        invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        amount = update_fields.get("amount", invoice["amount"])
        vat_percentage = update_fields.get("vat_percentage", (invoice["vat_amount"] / invoice["amount"]) * 100)
        
        vat_amount = amount * (vat_percentage / 100)
        total_amount = amount + vat_amount
        
        update_fields["vat_amount"] = vat_amount
        update_fields["total_amount"] = total_amount
    
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_fields})
    updated = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return Invoice(**updated)

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, user: User = Depends(get_current_user)):
    # Delete associated payments first
    await db.payments.delete_many({"invoice_id": invoice_id})
    # Delete invoice
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"}

@api_router.post("/payments")
async def create_payment(payment_data: PaymentCreate, user: User = Depends(get_current_user)):
    payment = Payment(**payment_data.model_dump())
    await db.payments.insert_one(payment.model_dump())
    
    invoice = await db.invoices.find_one({"id": payment_data.invoice_id}, {"_id": 0})
    if invoice:
        payments = await db.payments.find({"invoice_id": payment_data.invoice_id}, {"_id": 0}).to_list(1000)
        total_paid = sum(p["amount"] for p in payments)
        
        if total_paid >= invoice["total_amount"]:
            await db.invoices.update_one({"id": payment_data.invoice_id}, {"$set": {"status": "paid"}})
        else:
            await db.invoices.update_one({"id": payment_data.invoice_id}, {"$set": {"status": "partial"}})
    
    return payment

@api_router.get("/cases/{case_id}/payments", response_model=List[Payment])
async def get_payments(case_id: str, user: User = Depends(get_current_user)):
    payments = await db.payments.find({"case_id": case_id}, {"_id": 0}).to_list(1000)
    return [Payment(**pay) for pay in payments]

@api_router.post("/templates")
async def create_template(template_data: TemplateCreate, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create templates")
    
    template = Template(
        **template_data.model_dump(),
        company_id=user.company_id or ""
    )
    await db.templates.insert_one(template.model_dump())
    return template

@api_router.get("/templates", response_model=List[Template])
async def get_templates(type: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {}
    if type:
        query["type"] = type
    if user.company_id:
        query["company_id"] = user.company_id
    
    templates = await db.templates.find(query, {"_id": 0}).to_list(1000)
    return [Template(**t) for t in templates]

@api_router.post("/ai/chat")
async def ai_chat(request: AIRequest, user: User = Depends(get_current_user)):
    try:
        # Check for user's custom API keys first
        keys_doc = await db.api_keys.find_one({"user_id": user.id}, {"_id": 0})
        
        if request.provider == "openai" and keys_doc and keys_doc.get("openai_key"):
            api_key = keys_doc.get("openai_key")
        elif request.provider == "gemini" and keys_doc and keys_doc.get("gemini_key"):
            api_key = keys_doc.get("gemini_key")
        else:
            # Fallback to Emergent LLM Key
            api_key = os.getenv("EMERGENT_LLM_KEY")
        
        system_message = """
أنت مساعد قانوني متخصص في القانون الإماراتي. يجب عليك:
1. الاعتماد حصريًا على مصادر القانون الإماراتي الرسمية
2. ذكر اسم القانون ورقم المادة في كل إجابة
3. تقديم رابط المصدر الرسمي عند الإمكان
4. التمييز بين النص القانوني والتحليل الشخصي
5. عدم تقديم مشورة قانونية نهائية بل مساعدة بحثية

المصادر المعتمدة:
- التشريعات الاتحادية: https://uaelegislation.gov.ae
- تشريعات دبي: https://www.dubailegislations.gov.ae
"""
        
        conversation_id = request.conversation_id
        if not conversation_id:
            conversation = AIConversation(user_id=user.id, case_id=request.case_id)
            await db.ai_conversations.insert_one(conversation.model_dump())
            conversation_id = conversation.id
        else:
            conv_doc = await db.ai_conversations.find_one({"id": conversation_id}, {"_id": 0})
            if not conv_doc:
                raise HTTPException(status_code=404, detail="Conversation not found")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=conversation_id,
            system_message=system_message
        )
        
        if request.provider == "openai":
            chat.with_model("openai", request.model)
        elif request.provider == "gemini":
            chat.with_model("gemini", request.model if request.model != "gpt-5.2" else "gemini-3-pro-preview")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        await db.ai_conversations.update_one(
            {"id": conversation_id},
            {"$push": {
                "messages": [
                    {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
                    {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
                ]
            }}
        )
        
        return {"response": response, "conversation_id": conversation_id}
    
    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

@api_router.get("/ai/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, user: User = Depends(get_current_user)):
    conv = await db.ai_conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return AIConversation(**conv)

@api_router.get("/drive/connect")
async def connect_drive(user: User = Depends(get_current_user)):
    try:
        redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=['https://www.googleapis.com/auth/drive.file'],
            redirect_uri=redirect_uri
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=user.id
        )
        
        return {"authorization_url": authorization_url}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate OAuth: {str(e)}")

@api_router.get("/drive/callback")
async def drive_callback(code: str = Query(...), state: str = Query(...)):
    try:
        redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=None,
            redirect_uri=redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        await db.drive_credentials.update_one(
            {"user_id": state},
            {"$set": {
                "user_id": state,
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes,
                "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        frontend_url = os.getenv("FRONTEND_URL")
        return {"redirect": f"{frontend_url}/dashboard?drive_connected=true"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")

@api_router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    query = {}
    if user.company_id:
        query["company_id"] = user.company_id
    
    total_cases = await db.cases.count_documents(query)
    active_cases = await db.cases.count_documents({**query, "status": "active"})
    total_invoices = await db.invoices.count_documents({})
    pending_invoices = await db.invoices.count_documents({"status": "pending"})
    
    total_revenue = 0
    invoices = await db.invoices.find({"status": "paid"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(inv["total_amount"] for inv in invoices)
    
    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "total_invoices": total_invoices,
        "pending_invoices": pending_invoices,
        "total_revenue": total_revenue
    }

@api_router.get("/settings/api-keys")
async def get_api_keys(user: User = Depends(get_current_user)):
    keys_doc = await db.api_keys.find_one({"user_id": user.id}, {"_id": 0})
    if not keys_doc:
        return {
            "openai_key": "",
            "gemini_key": "",
            "google_drive_client_id": "",
            "google_drive_client_secret": ""
        }
    
    return {
        "openai_key": keys_doc.get("openai_key", "")[:10] + "..." if keys_doc.get("openai_key") else "",
        "gemini_key": keys_doc.get("gemini_key", "")[:10] + "..." if keys_doc.get("gemini_key") else "",
        "google_drive_client_id": keys_doc.get("google_drive_client_id", ""),
        "google_drive_client_secret": keys_doc.get("google_drive_client_secret", "")[:10] + "..." if keys_doc.get("google_drive_client_secret") else ""
    }

@api_router.post("/settings/api-keys")
async def save_api_keys(keys_data: dict, user: User = Depends(get_current_user)):
    allowed_keys = ["openai_key", "gemini_key", "google_drive_client_id", "google_drive_client_secret"]
    update_data = {k: v for k, v in keys_data.items() if k in allowed_keys and v and str(v).strip()}
    
    if not update_data:
        # لا توجد مفاتيح للحفظ - حذف المفاتيح القديمة إن وجدت
        await db.api_keys.delete_one({"user_id": user.id})
        return {"message": "No keys to save, will use Emergent LLM Key"}
    
    update_data["user_id"] = user.id
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.api_keys.update_one(
        {"user_id": user.id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "API keys saved successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()