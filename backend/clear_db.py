from database import engine, Base
import sys

def reset_database():
    print("⚠️  WARNING: This will delete ALL data in the database.")

    confirm = "yes"
    
    if confirm.lower() == 'yes': 
        try:
            # Drop all tables
            Base.metadata.drop_all(bind=engine)
            print("✅ All tables dropped.")
            
            # Recreate tables
            Base.metadata.create_all(bind=engine)
            print("✅ Database schema recreated successfully.")
        except Exception as e:
            print(f"❌ Error resetting database: {e}")
    else:
        print("Operation cancelled.")

if __name__ == "__main__":
    reset_database()