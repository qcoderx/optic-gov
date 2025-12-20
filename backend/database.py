from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/optic_gov")

# UPDATED: Added pool_pre_ping=True to fix SSL disconnect errors
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,  # Pings DB before query to ensure connection is alive
    pool_recycle=300     # Recycles connections every 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Contractor(Base):
    __tablename__ = "contractors"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String, unique=True, index=True)
    company_name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    total_budget = Column(Float) # Now stores SUI amount
    contractor_id = Column(Integer, ForeignKey("contractors.id"))
    gov_wallet = Column(String)
    ai_generated = Column(Boolean, default=False)
    project_latitude = Column(Float)
    project_longitude = Column(Float)
    location_tolerance_km = Column(Float, default=1.0)
    on_chain_id = Column(String, nullable=True) # SUI Object ID
    sui_project_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    milestones = relationship("Milestone", back_populates="project")

class Milestone(Base):
    __tablename__ = "milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    description = Column(Text)
    amount = Column(Float) # Now stores SUI amount
    order_index = Column(Integer)
    is_completed = Column(Boolean, default=False)
    status = Column(String, default="pending")  # pending, completed, verified
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="milestones")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()