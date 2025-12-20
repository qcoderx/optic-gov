from database import engine
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

def migrate_db():
    with engine.connect() as conn:
        try:
            print("Starting migration...")
            
            # Add location columns (using IF NOT EXISTS to be safe)
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_latitude FLOAT"))
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_longitude FLOAT"))
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS location_tolerance_km FLOAT DEFAULT 1.0"))
            
            # Add SUI specific columns (The fix for your error)
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS sui_project_id VARCHAR"))
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS on_chain_id VARCHAR"))
            
            conn.commit()
            print("✅ Database migration completed successfully")
        except Exception as e:
            print(f"❌ Migration error: {e}")

if __name__ == "__main__":
    migrate_db()