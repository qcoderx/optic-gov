import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tabulate import tabulate
from dotenv import load_dotenv

# Local imports from your project
from database import Contractor, Project, Milestone

load_dotenv()

def list_database_contents():
    # 1. Setup Connection
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    print("\n" + "="*80)
    print("📊 OPTIC-GOV DATABASE OVERVIEW")
    print("="*80)

    # 2. List Contractors
    contractors = session.query(Contractor).all()
    contractor_data = [[c.id, c.company_name, c.wallet_address[:10]+"..."+c.wallet_address[-6:], c.email] for c in contractors]
    print("\n👷 CONTRACTORS")
    print(tabulate(contractor_data, headers=["ID", "Company Name", "Wallet", "Email"], tablefmt="grid"))

    # 3. List Projects
    projects = session.query(Project).all()
    project_data = []
    for p in projects:
        # Format MNT budget
        budget = f"{p.total_budget:.8f} MNT" if p.total_budget else "0.00 MNT"
        on_chain = p.on_chain_id if p.on_chain_id else "❌ NONE"
        project_data.append([p.id, p.name, budget, p.contractor_id, on_chain])
    
    print("\n🏗️  PROJECTS")
    print(tabulate(project_data, headers=["ID", "Project Name", "Budget", "Contr. ID", "On-Chain ID"], tablefmt="grid"))

    # 4. List Milestones
    milestones = session.query(Milestone).all()
    milestone_data = []
    for m in milestones:
        status_icon = "✅" if m.status == "verified" else "⏳"
        milestone_data.append([m.id, m.project_id, m.order_index, m.description[:30]+"...", f"{m.amount:.8f} MNT", f"{status_icon} {m.status}"])
    
    print("\n🎯 MILESTONES")
    print(tabulate(milestone_data, headers=["ID", "Proj ID", "Idx", "Description", "Amount", "Status"], tablefmt="grid"))

    print("\n" + "="*80)
    session.close()

if __name__ == "__main__":
    try:
        list_database_contents()
    except Exception as e:
        print(f"❌ Error: {e}")