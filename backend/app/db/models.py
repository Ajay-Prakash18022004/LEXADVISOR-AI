import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    preferred_language = Column(String(50), default="English")
    role = Column(String(50), default="client") # "client" or "advocate"
    google_id = Column(String(150), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    generated_docs = relationship("GeneratedDoc", back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    deadlines = relationship("Deadline", back_populates="user", cascade="all, delete-orphan")
    advocate_profile = relationship("Advocate", back_populates="user", uselist=False)
    client_cases = relationship("LegalCase", foreign_keys="LegalCase.client_id", back_populates="client")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    doc_type = Column(String(100), default="general_agreement")
    state = Column(String(20), default="TS") # TS, AP, or GENERAL
    extracted_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="documents")
    chat_messages = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan")
    stamp_report = relationship("StampReport", back_populates="document", uselist=False, cascade="all, delete-orphan")
    risk_report = relationship("RiskReport", back_populates="document", uselist=False, cascade="all, delete-orphan")
    action_plan = relationship("ActionPlan", back_populates="document", uselist=False, cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    role = Column(String(50), nullable=False) # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")
    document = relationship("Document", back_populates="chat_messages")


class GeneratedDoc(Base):
    __tablename__ = "generated_docs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doc_type = Column(String(100), nullable=False) # "agreement", "notice", "email", "draft"
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    parties_summary = Column(String(300), nullable=True)
    key_terms_json = Column(Text, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="generated_docs")


class StampReport(Base):
    __tablename__ = "stamp_reports"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    fields_json = Column(Text, nullable=False) # Serialized StampFields
    checks_json = Column(Text, nullable=False) # Serialized list of CheckResult
    confidence_score = Column(Integer, default=100) # 0-100
    risk_level = Column(String(20), default="low") # "low", "medium", "high"
    recommendations_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="stamp_report")


class RiskReport(Base):
    __tablename__ = "risk_reports"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    overall_risk = Column(String(20), default="medium") # "low", "medium", "high"
    risk_score = Column(Integer, default=50) # 0-100
    report_json = Column(Text, nullable=False) # JSON containing missing_clauses, identified_risks, recommendations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="risk_report")


class ActionPlan(Base):
    __tablename__ = "action_plans"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    action_urgency = Column(String(20), default="moderate")
    plan_json = Column(Text, nullable=False) # JSON containing steps, timeline, notice outline, brief
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="action_plan")


class Advocate(Base):
    __tablename__ = "advocates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(150), nullable=False)
    bar_council_id = Column(String(100), nullable=True)
    state_bar_council = Column(String(100), nullable=True)
    specialization = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False)
    area = Column(String(150), nullable=True)
    state = Column(String(50), nullable=False)
    lat = Column(Float, nullable=False, default=17.3850)
    lng = Column(Float, nullable=False, default=78.4867)
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    experience_years = Column(Integer, default=5)
    rating = Column(Float, default=4.5)
    consultation_fee = Column(Float, default=1500.0)
    address = Column(String(300), nullable=True)
    verification_status = Column(String(50), default="pending") # "pending", "verified", "rejected"
    bio = Column(Text, nullable=True)
    languages_spoken = Column(String(200), default="English, Hindi, Telugu")
    available_days = Column(String(200), default="Monday,Tuesday,Wednesday,Thursday,Friday")
    available_time_slots = Column(Text, default='["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM", "05:30 PM"]')
    consultation_modes = Column(String(200), default="In-Chamber, Phone Consultation, Video Call")
    slot_duration_mins = Column(Integer, default=30)
    avatar_url = Column(String(300), nullable=True)

    user = relationship("User", back_populates="advocate_profile")
    appointments = relationship("Appointment", back_populates="advocate", cascade="all, delete-orphan")
    cases = relationship("LegalCase", foreign_keys="LegalCase.advocate_id", back_populates="advocate")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    advocate_id = Column(Integer, ForeignKey("advocates.id"), nullable=False)
    client_name = Column(String(150), nullable=False)
    client_phone = Column(String(50), nullable=False)
    client_email = Column(String(150), nullable=False)
    appointment_date = Column(String(50), nullable=False) # e.g. "2026-11-05"
    time_slot = Column(String(50), nullable=False)        # e.g. "10:30 AM"
    consultation_type = Column(String(50), default="In-Chamber") # In-Chamber, Phone Consultation, Video Call
    case_subject = Column(String(255), nullable=False)
    case_notes = Column(Text, nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    fee = Column(Float, default=1500.0)
    status = Column(String(30), default="pending")        # "pending", "confirmed", "completed", "cancelled", "rejected"
    rejection_reason = Column(Text, nullable=True)
    rescheduled_date = Column(String(50), nullable=True)
    rescheduled_time = Column(String(50), nullable=True)
    notification_sent = Column(Boolean, default=False)
    notification_email = Column(String(150), default="sureshtakur194@gmail.com")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    advocate = relationship("Advocate", back_populates="appointments")
    user = relationship("User", back_populates="appointments")
    document = relationship("Document")
    case = relationship("LegalCase", back_populates="appointment", uselist=False)


class LegalCase(Base):
    __tablename__ = "legal_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    advocate_id = Column(Integer, ForeignKey("advocates.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Civil / Property")
    status = Column(String(50), default="New") # "New", "Under Review", "In Progress", "Awaiting Client Information", "Awaiting Hearing", "Resolved", "Closed"
    description = Column(Text, nullable=True)
    next_hearing_date = Column(String(50), nullable=True)
    court_name = Column(String(200), nullable=True)
    resolution_date = Column(String(50), nullable=True)
    resolution_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    client = relationship("User", foreign_keys=[client_id], back_populates="client_cases")
    advocate = relationship("Advocate", foreign_keys=[advocate_id], back_populates="cases")
    appointment = relationship("Appointment", back_populates="case")
    activities = relationship("CaseActivity", back_populates="case", cascade="all, delete-orphan", order_by="CaseActivity.created_at.desc()")
    documents = relationship("CaseDocument", back_populates="case", cascade="all, delete-orphan")


class CaseActivity(Base):
    __tablename__ = "case_activities"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String(150), nullable=False)
    author_role = Column(String(50), nullable=False) # "client" or "advocate"
    activity_type = Column(String(50), default="status_change") # "note", "hearing", "document", "status_change"
    message = Column(Text, nullable=False)
    is_private_to_advocate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("LegalCase", back_populates="activities")


class CaseDocument(Base):
    __tablename__ = "case_documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), default="document")
    uploaded_by_role = Column(String(50), default="client")
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("LegalCase", back_populates="documents")


class Deadline(Base):
    __tablename__ = "deadlines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    title = Column(String(200), nullable=False)           # e.g. "Monthly Rent Payment Due"
    category = Column(String(50), default="rent_payment") # "rent_payment", "notice_period", "lease_renewal", "stamp_registration", "bond_rule", "custom"
    due_date = Column(String(50), nullable=False)         # YYYY-MM-DD
    amount = Column(Float, nullable=True)                 # e.g. 35000.0
    recurrence = Column(String(50), default="monthly")    # "monthly", "once", "yearly"
    remind_days_before = Column(Integer, default=3)
    status = Column(String(30), default="upcoming")       # "upcoming", "due_soon", "completed", "overdue"
    notes = Column(Text, nullable=True)                   # Plain language description of bond rule / agreement rule
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="deadlines")
    document = relationship("Document")

