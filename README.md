# 🏗️ Optic-Gov

> **AI-Powered Blockchain Infrastructure Management**  
> Transparent, milestone-based project funding with AI verification on Mantle Network

[![Mantle Network](https://img.shields.io/badge/Mantle-Sepolia-green)](https://sepolia.mantle.xyz)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-18+-61DAFB.svg)](https://reactjs.org)

## 🎯 Problem Statement

Nigeria's infrastructure development faces critical challenges:
- **Lack of Transparency**: Projects funded with no visibility into progress
- **Payment Disputes**: Contractors vs. government disagreements on milestone completion
- **Budget Overruns**: No milestone-based fund release mechanism
- **Documentation Gaps**: Manual verification processes prone to corruption

**Optic-Gov solves this with blockchain + AI.**

---

## ✨ Features

### 🔐 Blockchain-Powered Transparency
- **Smart Contract Escrow**: Funds locked in Mantle blockchain until milestones verified
- **Immutable Audit Trail**: Every transaction permanently recorded on-chain
- **Milestone-Based Payments**: Contractors only paid after completing verified work
- **Real-time Currency Conversion**: Supports both Nigerian Naira (NGN) and Mantle (MNT)

### 🤖 AI Verification Oracle
- **Video Evidence Analysis**: Google Gemini AI analyzes construction progress videos
- **Automated Milestone Verification**: AI determines if work matches criteria
- **Confidence Scoring**: Returns 0-100 confidence score for human oversight
- **Fraud Detection**: AI flags suspicious or mismatched evidence

### 📊 Government Dashboard
- **Project Creation**: Deploy smart contracts with customizable milestones
- **Budget Management**: Track funds across all projects in real-time
- **Contractor Management**: Onboard and manage contractor wallets
- **Analytics**: View project completion rates, spending trends

### 👷 Contractor Portal
- **Milestone Tracking**: View assigned projects and pending milestones
- **Evidence Submission**: Upload video proof of completed work
- **Payment History**: Track all milestone payments received
- **Real-time Status**: See AI verification results instantly

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────-─┐
│   React Frontend│◄────►│  FastAPI Backend │◄────►│ Mantle Blockchain│
│   (TypeScript)  │      │    (Python)      │      │  Smart Contract  │
└────────┬────────┘      └─────────┬────────┘      └────────────────-─┘
         │                         │
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│  ConnectKit     │      │  Google Gemini   │
│  (Wallet Auth)  │      │  (AI Oracle)     │
└─────────────────┘      └──────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │   PostgreSQL     │
                         │   (Metadata)     │
                         └──────────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- TailwindCSS for styling
- Wagmi + ethers.js for Web3 integration
- ConnectKit for wallet connection
- React Router for navigation

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy + PostgreSQL for database
- Web3.py for blockchain interaction
- Google Gemini AI for video verification
- JWT authentication for contractors

**Blockchain:**
- Solidity 0.8.20 smart contracts
- Mantle Sepolia Testnet (Chain ID: 5003)
- OpenZeppelin contracts for security

---

## 🚀 Quick Start

### Prerequisites
```bash
# System Requirements
Node.js 18+
Python 3.11+
PostgreSQL 14+
MetaMask wallet extension
```

### 1. Clone Repository
```bash
git clone https://github.com/qcoderx/optic-gov.git
cd optic-gov
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key
ETHEREUM_PRIVATE_KEY=your_oracle_private_key
CONTRACT_ADDRESS=0x5B177FF2F5c17a753b9C0e381268E8908fFD178E
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
DATABASE_URL=postgresql://user:password@localhost/opticgov
EOF

# Initialize database
python -c "from database import init_db; init_db()"

# Start server
python main.py
# Backend runs on http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_MANTLE_CONTRACT_ADDRESS=0x5B177FF2F5c17a753b9C0e381268E8908fFD178E
EOF

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Get Test Funds

1. **Get Sepolia ETH**: https://sepoliafaucet.com
2. **Bridge to Mantle Sepolia**: https://bridge.sepolia.mantle.xyz
3. **Fund Oracle Wallet**: Send 0.1 MNT to your oracle address

---

## 📖 Usage Guide

### For Government Officials

#### Creating a Project
1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask
2. **Fill Project Details**:
   - Project Name (e.g., "Lagos-Ibadan Highway")
   - Contractor Wallet Address
   - Budget (in NGN or MNT)
3. **Define Milestones**:
   - **AI Mode**: Describe project, AI generates milestones
   - **Manual Mode**: Add custom milestone descriptions
4. **Deploy Contract**: Sign transaction, project deploys to blockchain
5. **Track Progress**: Monitor milestone completion in dashboard

#### Verifying Milestones
1. Contractor submits video evidence
2. AI Oracle analyzes video automatically
3. If verified (confidence ≥70%), funds auto-release
4. If rejected, contractor can resubmit

### For Contractors

#### Registering
```bash
POST /register
{
  "wallet_address": "0x...",
  "company_name": "ABC Construction Ltd",
  "email": "contractor@example.com",
  "password": "secure_password"
}
```

#### Submitting Evidence
1. **Login**: Authenticate with wallet + password
2. **Select Milestone**: Choose pending milestone
3. **Upload Video**: Record work progress (max 50MB)
4. **Submit**: AI verifies within 60 seconds
5. **Get Paid**: Funds released to wallet automatically

---

## 🔧 API Documentation

### Project Endpoints

```bash
# Create Project
POST /create-project
Content-Type: application/json

{
  "name": "Project Name",
  "description": "Project description",
  "total_budget": 1000000,
  "budget_currency": "NGN",
  "contractor_wallet": "0x...",
  "use_ai_milestones": true,
  "project_latitude": 6.5244,
  "project_longitude": 3.3792,
  "gov_wallet": "0x...",
  "on_chain_id": 1
}

# Get All Projects
GET /projects

# Get Project Details
GET /projects/{project_id}

# Verify Milestone
POST /verify-milestone
{
  "video_url": "http://localhost:8000/static/uploads/video.mp4",
  "milestone_criteria": "Site clearing completed",
  "project_id": 1,
  "milestone_index": 1
}
```

### Currency Conversion

```bash
# Get Exchange Rate
GET /exchange-rate

# Convert NGN to MNT
GET /convert/ngn-to-mnt/1000000
```

### Debug Endpoints (Development Only)

```bash
# Compare DB vs Blockchain
GET /debug/compare-amounts/{project_id}

# Get Transaction Details
GET /debug/transaction-receipt/{tx_hash}

# Check Oracle Balance
GET /debug/oracle-balance

# Sync Project from Blockchain
POST /admin/sync-project-from-blockchain/{project_id}
```

---

## 📊 Smart Contract

### OpticGov.sol

**Key Functions:**

```solidity
// Create new project with milestones
function createProject(
    address _contractor,
    uint256[] calldata _milestoneAmounts,
    string[] calldata _milestoneDescriptions
) external payable returns (uint256);

// Submit evidence for milestone
function submitEvidence(
    uint256 _projectId,
    uint256 _milestoneIndex,
    string calldata _ipfsHash
) external;

// Release milestone funds (Oracle only)
function releaseMilestone(
    uint256 _projectId,
    uint256 _milestoneIndex,
    bool _verdict
) external;
```

**Deployed Contract:**
- **Network**: Mantle Sepolia Testnet
- **Address**: `0x5B177FF2F5c17a753b9C0e381268E8908fFD178E`
- **Explorer**: [View on Mantle Explorer](https://sepolia.mantlescan.xyz/address/0x5B177FF2F5c17a753b9C0e381268E8908fFD178E)

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Test Flow
```bash
# 1. Create test project
curl -X POST http://localhost:8000/create-project \
  -H "Content-Type: application/json" \
  -d @test_project.json

# 2. Upload verification video
curl -X POST http://localhost:8000/upload-video \
  -F "video=@test_video.mp4"

# 3. Verify milestone
curl -X POST http://localhost:8000/verify-milestone \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "http://localhost:8000/static/uploads/test.mp4",
    "milestone_criteria": "Foundation completed",
    "project_id": 1,
    "milestone_index": 1
  }'

# 4. Check blockchain transaction
curl http://localhost:8000/debug/compare-amounts/1
```

---

## 🔒 Security

### Smart Contract Security
- ✅ **CEI Pattern**: Checks-Effects-Interactions prevents reentrancy
- ✅ **Access Control**: Only oracle can release funds
- ✅ **Immutable Oracle**: Set at deployment, cannot be changed
- ✅ **No Storage Manipulation**: All state changes logged via events

### Backend Security
- ✅ **JWT Authentication**: Secure contractor login
- ✅ **Password Hashing**: bcrypt with salt
- ✅ **SQL Injection Protection**: SQLAlchemy ORM
- ✅ **CORS Configuration**: Restricted origins in production
- ✅ **Rate Limiting**: Prevents API abuse

### AI Oracle Security
- ✅ **Video Validation**: File type and size checks
- ✅ **Timeout Protection**: 60s max processing time
- ✅ **Confidence Threshold**: Minimum 70% for auto-approval
- ✅ **Human Override**: Government can manually verify

---

## 🐛 Common Issues & Solutions

### Gas Estimation Failed
**Error**: `intrinsic gas too low`
**Fix**: Ensure oracle wallet has sufficient MNT balance
```bash
curl http://localhost:8000/debug/oracle-balance
```

### Video Upload Timeout
**Error**: `Read timed out`
**Fix**: Reduce video size (max 50MB) or compress
```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec mp3 output.mp4
```

### AI Verification Failed
**Error**: `AI Oracle failed after 3 attempts`
**Fix**: Check Gemini API key and quota
```bash
curl http://localhost:8000/test-gemini
```

### Milestone Amount Mismatch
**Error**: Database shows different amount than blockchain
**Fix**: Sync database with blockchain
```bash
curl -X POST http://localhost:8000/admin/sync-project-from-blockchain/{project_id}
```

---

## 📈 Roadmap

### Phase 1: MVP (Current)
- [x] Smart contract deployment
- [x] Basic project creation
- [x] AI milestone verification
- [x] Payment automation

### Phase 2: Enhanced Features (Q2 2025)
- [ ] Multi-signature approvals
- [ ] Dispute resolution system
- [ ] Mobile app (iOS/Android)
- [ ] SMS notifications for contractors
- [ ] Batch project creation

### Phase 3: Scale (Q3 2025)
- [ ] Mainnet deployment
- [ ] Integration with Nigerian government systems
- [ ] Support for multiple cryptocurrencies
- [ ] Advanced analytics dashboard
- [ ] Public project explorer

### Phase 4: Ecosystem (Q4 2025)
- [ ] DAO governance for oracle decisions
- [ ] Contractor reputation scoring
- [ ] Insurance integration
- [ ] Cross-chain bridges
- [ ] API for third-party integrations

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- **Python**: Follow PEP 8, use Black formatter
- **TypeScript**: Follow Airbnb style guide, use Prettier
- **Solidity**: Follow Solidity style guide

---

## 🙏 Acknowledgments

- [Mantle Network](https://mantle.xyz) - L2 blockchain infrastructure
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI verification
- [OpenZeppelin](https://openzeppelin.com) - Smart contract libraries

---

## 📞 Support
_all dummies for now_
- **Documentation**: [docs.optic-gov.com](https://docs.optic-gov.com)
- **Discord**: [Join our community](https://discord.gg/opticgov)
- **Email**: support@optic-gov.com
- **Twitter**: [@OpticGov](https://twitter.com/opticgov)

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐!

## Star History

<a href="https://www.star-history.com/#qcoderx/optic-gov&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=qcoderx/optic-gov&type=date&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=qcoderx/optic-gov&type=date&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=qcoderx/optic-gov&type=date&legend=bottom-right" />
 </picture>
</a>

---

**Built with 💚 for a transparent Nigeria**
