from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/optic_gov")

# Optimization: pool_pre_ping ensures stale connections are removed before use
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,  
    pool_recycle=300     
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
    total_budget = Column(Float) # Stores MNT amount
    contractor_id = Column(Integer, ForeignKey("contractors.id"))
    gov_wallet = Column(String)
    ai_generated = Column(Boolean, default=False)
    project_latitude = Column(Float)
    project_longitude = Column(Float)
    location_tolerance_km = Column(Float, default=1.0)
    on_chain_id = Column(String, nullable=True) # Mantle Project Index
    created_at = Column(DateTime, default=datetime.utcnow)
    
    milestones = relationship("Milestone", back_populates="project")

class Milestone(Base):
    __tablename__ = "milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    description = Column(Text)
    amount = Column(Float) # Stores MNT amount for this specific milestone
    order_index = Column(Integer) # 1-based index (converted to 0-based in main.py)
    is_completed = Column(Boolean, default=False)
    status = Column(String, default="pending")  # pending, verified, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="milestones")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()