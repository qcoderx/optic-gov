#!/usr/bin/env python3
"""
Fix projects with missing on_chain_id values
"""
import os
import uuid
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
        # Find projects with missing on_chain_id
        result = conn.execute(text("""
            SELECT id, name FROM projects 
            WHERE on_chain_id IS NULL OR on_chain_id = '' OR on_chain_id = 'None'
        """))
        
        projects = result.fetchall()
        
        if not projects:
            print("✅ All projects have on_chain_id values")
        else:
            print(f"🔧 Found {len(projects)} projects with missing on_chain_id")
            
            for project in projects:
                project_id, project_name = project
                demo_id = f"demo_project_{uuid.uuid4().hex[:8]}"
                
                conn.execute(text("""
                    UPDATE projects 
                    SET on_chain_id = :demo_id 
                    WHERE id = :project_id
                """), {"demo_id": demo_id, "project_id": project_id})
                
                print(f"  ✅ Project {project_id} ({project_name}): {demo_id}")
            
            conn.commit()
            print("🎉 All projects now have on_chain_id values!")
            
except Exception as e:
    print(f"❌ Error: {e}")