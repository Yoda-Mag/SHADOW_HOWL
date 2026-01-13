# 🐺 SHADOW HOWL FX SYSTEM

### **Web-Based AI Trading Signal Platform**

A professional trading signal delivery platform designed for manual execution on MT4/MT5 platforms. This system features high-end AI branding on the front end while maintaining 100% manual Admin control on the back end.

---

##  Project Overview

The goal of the Shadow Howl System is to provide subscribers with real-time, high-probability trading signals. This is **NOT** an auto-trading robot; it is a signal broadcasting hub where users receive market data and place trades manually on their own accounts.

### **Key Objectives:**

* **Secure Authentication**: Role-based access for Admins and Subscribers.


* **Manual Control**: No autonomous AI logic; admins have final approval on every signal.


* **AI Branding**: Front-end presentation that emphasizes "AI-Generated" alerts for marketing and user engagement.


* **Non-Custodial**: Does not connect to user trading accounts or brokers.



---

##  Tech Stack

* **Frontend**: React.js (Desktop & Mobile Responsive) 


* **Backend**: Node.js & Express.js
* **Database**: MySQL (Relational data for Users, Subscriptions, and Signals)
* **Security**: JSON Web Tokens (JWT) for secure session management 


* **Payment Gateway**: South Africa compatible integration 



---

##  Core Functionality

### **1. Signal Broadcasting System**

* **Admin Dashboard**: Create, Edit, or Delete signals.


* **Signal Fields**: Includes Trading Pair (e.g., BTCUSD), Direction (BUY/SELL), Entry Price, SL, TP, and automated Risk Disclaimers.


* **User Feed**: Clean, live feed of signals with timestamps and historical data.



### **2. Subscription & Access Control**

* **Paywall**: Access to live signals is restricted to active subscribers.


* **Pricing Models**: Support for monthly/annual subscriptions and one-time system access fees.


* **Admin Management**: Admins can manually activate or deactivate users.



### **3. AI Coach / Assistant**

* A chat interface for user engagement.


* **Hybrid Backend**: Admin replies manually or utilizes a ChatGPT-assisted system for basic trading questions.



---

##  Legal & Risk Requirements

To comply with financial regulations, the platform strictly enforces the following:

* **No Execution**: The platform never executes trades on behalf of users.


* **Disclaimers**: Every signal is automatically appended with: *"This is not financial advice. Trade at your own risk."*.



---

##  Project Structure

```text
├── client/                 # React Frontend (UI/UX)
├── server/                 # Node.js Backend (API)
│   ├── Config/             # Database connection
│   ├── Controllers/        # Business logic (Signals, Users)
│   ├── Middleware/         # Auth & Role verification
│   └── Routes/             # API Endpoints
└── database/               # SQL Scripts & Migrations

```

---

##  Getting Started

1. **Clone the Repository**
2. **Server Setup**:
* Navigate to `/server` and run `npm install`.
* Create a `.env` file with `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, and `JWT_SECRET`.
* Run `node index.js` to start the backend.


3. **Client Setup**:
* Navigate to `/client` and run `npm install`.
* Run `npm start` to view the AI Dashboard.



---

##  Future Roadmap (Phase 2)

* Mobile Application (iOS & Android).


* Advanced Signal Performance Statistics (Win Rate / RR).


* Tiered Subscription Deals.


* Affiliate / Referral System.



---
