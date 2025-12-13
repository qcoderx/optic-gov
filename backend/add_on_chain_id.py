#!/usr/bin/env python3
"""
Add on_chain_id column to projects table
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in environment")
    exit(1)

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='projects' AND column_name='on_chain_id'
        """))
        
        if result.fetchone() is None:
            print("Adding on_chain_id column to projects table...")
            conn.execute(text("ALTER TABLE projects ADD COLUMN on_chain_id INTEGER"))
            conn.commit()
            print("Column added successfully!")
        else:
            print("Column already exists!")
            
except Exception as e:
    print(f"Error: {e}")