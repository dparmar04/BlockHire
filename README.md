# 🚀 BlockHire - Decentralized Freelance Escrow Platform

A blockchain-based escrow system that ensures secure payments between clients and freelancers using smart contracts.

## 🌟 Features

- ✅ Escrow-based payment protection
- ✅ 7-day auto-release mechanism
- ✅ Dispute resolution system
- ✅ IPFS integration for deliverables
- ✅ MetaMask wallet connection
- ✅ Admin dashboard for arbitration

## 🔗 Live Demo

**Frontend:** https://blockhire-escrow.vercel.app/

## 🛠️ Tech Stack

### Blockchain
- Solidity ^0.8.19
- Ethereum (Sepolia Testnet)
- MetaMask

### Frontend
- React 18
- Vite
- Tailwind CSS v4
- ethers.js v6
- React Router v6

### Storage
- IPFS (Pinata)

## 📊 Smart Contract Details

**Network:** Sepolia Testnet  
**Contract Address:** `0xYOUR_CONTRACT_ADDRESS`  
**Platform Fee:** 2%  
**Auto-Release Period:** 7 days

## 🎯 How It Works

1. **Client** creates a job and locks payment in escrow
2. **Freelancer** accepts the job
3. **Freelancer** submits work with IPFS deliverables
4. **Client** approves → Payment released instantly
5. **Auto-Release:** If client doesn't respond in 7 days, payment auto-releases
6. **Disputes:** Either party can raise dispute → Admin resolves

## 🚀 Local Development

### Prerequisites
- Node.js v18+
- MetaMask wallet
- Sepolia testnet ETH

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/BlockHire.git
cd BlockHire

# Install frontend dependencies
cd frontend
npm install

# Create .env file
cp .env.example .env
# Add your CONTRACT_ADDRESS and PINATA keys

# Start development server
npm run dev
