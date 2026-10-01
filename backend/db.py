"""
db.py — SQLAlchemy engine, session factory, and ORM models.
Engine is created lazily so the module can be imported without a valid DB URL
(useful for syntax checks). The URL must be set in .env before actually running.
"""
import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

Base = declarative_base()

# ── ORM Model ──────────────────────────────────────────────────────────────────

class Deviation(Base):
    """One row per saved deviation record."""
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)

    # Section 1: Deviation Information
    site_plant = Column(String(255), nullable=True)
    date_of_occurrence = Column(String(20), nullable=True)        # dd-mm-yyyy string
    title = Column(String(500), nullable=True)
    source = Column(String(100), nullable=True)
    related_product = Column(String(255), nullable=True)
    batch_lot_number = Column(String(100), nullable=True)

    # Section 1b: Product Details
    product_strength = Column(String(100), nullable=True)         # e.g. "500 mg"
    product_amount = Column(String(100), nullable=True)           # e.g. "48 kg" / "10,000 units"
    dosage_form = Column(String(100), nullable=True)              # Tablet | Capsule | Injection | etc.
    manufacturing_date = Column(String(20), nullable=True)        # mm-yyyy string
    expiry_date = Column(String(20), nullable=True)               # mm-yyyy string

    # Section 2: Deviation Details
    detailed_description = Column(Text, nullable=True)
    initial_impact = Column(String(100), nullable=True)
    initial_severity = Column(String(50), nullable=True)

    # AI Risk Assessment (stored alongside final values for auditability)
    ai_severity = Column(String(50), nullable=True)
    ai_impact = Column(String(100), nullable=True)
    ai_reason = Column(Text, nullable=True)
    next_action = Column(Text, nullable=True)
    containment = Column(Text, nullable=True)
    root_cause_hints = Column(JSON, nullable=True)                # list of strings

    created_at = Column(DateTime, default=datetime.utcnow)


# ── Lazy engine / session ──────────────────────────────────────────────────────

_engine = None
_SessionLocal = None


def _get_engine():
    global _engine
    if _engine is None:
        url = os.getenv("DATABASE_URL")
        # Try PostgreSQL if specified
        if url and "postgresql" in url:
            try:
                temp_engine = create_engine(
                    url,
                    pool_pre_ping=True,
                    connect_args={"connect_timeout": 2}
                )
                with temp_engine.connect():
                    pass
                _engine = temp_engine
                print("[AIVOA DB] Connected to PostgreSQL successfully.")
                return _engine
            except Exception as e:
                print(f"[AIVOA DB] PostgreSQL not reachable at {url} ({e}).")
                print("[AIVOA DB] Automatically falling back to local SQLite database (deviations.db) — Docker is NOT required!")

        # Fallback to local SQLite database so Docker is optional
        sqlite_file = os.path.join(os.path.dirname(__file__), "deviations.db")
        sqlite_url = f"sqlite:///{sqlite_file}"
        _engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=_engine)
        print(f"[AIVOA DB] Active database: SQLite ({sqlite_file})")
    return _engine


def _get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=_get_engine(), autocommit=False, autoflush=False)
    return _SessionLocal


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=_get_engine())


def get_db():
    """FastAPI dependency: yields a DB session and closes it after use."""
    SessionLocal = _get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
