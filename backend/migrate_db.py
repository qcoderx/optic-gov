from database import engine
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

def add_location_columns():
    with engine.connect() as conn:
        try:
            # Add location columns to projects table
            conn.execute(text("ALTER TABLE projects ADD COLUMN project_latitude FLOAT"))
            conn.execute(text("ALTER TABLE projects ADD COLUMN project_longitude FLOAT"))
            conn.execute(text("ALTER TABLE projects ADD COLUMN location_tolerance_km FLOAT DEFAULT 1.0"))
            conn.commit()
            print("Location columns added successfully")
        except Exception as e:
            print(f"Migration error (may already exist): {e}")

if __name__ == "__main__":
    add_location_columns()