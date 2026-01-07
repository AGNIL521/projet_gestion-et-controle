# PerfOptima: AI-Driven Intelligent Dashboard

**PerfOptima** is an advanced Organizational Performance Management System designed to demonstrate the power of Artificial Intelligence in Management Control. It combines modern web technologies with machine learning to provide real-time forecasting, scenario simulation, and strategic decision support.

## 🚀 Key Features

### 🧠 AI-Powered Forecasting
- **Weighted Linear Regression**: Uses advanced regression models that prioritize recent trends over historical data for higher reactivity.
- **Confidence Scoring**: Dynamic confidence metric that penalizes volatility and non-linear patterns (e.g., drops confidence during seasonal fluctuations).
- **Smart Trend Detection**: Distinguishes between "Growth", "Decline", and "Recovery" phases.

### 💾 Persistent Data & Simulation
- **SQLite Database**: All simulation data and user inputs are securely stored in a persistent `perfoptima.db` database.
- **Scenario History**: Generates and saves 24-month historical data for each selected scenario.
- **State Persistence**: Remembers your last active scenario and manual overrides even after server restarts.

### 🎮 Interactive Scenario Simulation
Simulate different market conditions to test organizational resilience:
- **📈 Growth**: Steady upward trend with high confidence.
- **📉 Decline**: Market contraction scenarios requiring cost-cutting measures.
- **❄️ Seasonal**: Cyclic patterns (sine-wave based) to test inventory planning.
- **⚡ Volatile**: High-noise environments to test risk management.

### 💡 Strategic Insights & Decision Support
- **Managerial Recommendations**: Context-aware advice (e.g., "Increase Inventory" vs. "Preserve Cash Flow") based on the active scenario.
- **Risk Score**: Real-time risk assessment (0-100) derived from market volatility and model confidence.
- **Performance Gap Analysis**: Instant comparison against target KPIs.

### 🔐 Secure Access
- **Authentication**: Secure Login Page to restrict access to the dashboard.
- **Session Management**: Maintains user session state across page reloads.

### 🔧 "What-If" Analysis (Manual Override)
- **Manual Data Injection**: Force specific revenue/target values to simulate shocks (e.g., "What if revenue drops to $5k?").
- **Instant Recalibration**: The AI immediately updates its forecast and alerts based on your manual input.

---

## 🛠️ Tech Stack

### Backend (Python)
- **Framework**: FastAPI (High-performance API)
- **Database**: SQLite with SQLAlchemy ORM
- **ML Engine**: Scikit-learn (Linear Regression), NumPy, Pandas
- **Server**: Uvicorn

### Frontend (Modern Web)
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: Recharts (Responsive interactive charts)
- **Icons**: Lucide React

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+

### 1. Backend Setup
Navigate to the project root:
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the backend server
python run.py
```
*The API will start at `http://localhost:8000` and automatically initialize the database.*

### 2. Frontend Setup
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The Dashboard will be available at `http://localhost:3000`*

### 🔑 Default Credentials
Use these credentials to log in:
- **Email**: `admin@perfoptima.com`
- **Password**: `admin`

---

## 🖥️ Usage Guide

1.  **Login**: Authenticate using the default credentials.
2.  **Dashboard Overview**: View real-time KPIs (Revenue, Gap, Forecast, Risk Score).
3.  **Switch Scenarios**: Use the "Scenario Selector" (top left) to switch between Growth, Decline, Seasonal, and Volatile modes. Observe how the AI Insights change.
4.  **Adjust Data**: Click the floating **"Adjust Data"** button (bottom right) to manually set the current month's revenue or target.
    *   *Try entering a low value (e.g., 5000) to trigger a "CRITICAL ALERT".*
    *   *Try entering a high value to trigger an "OPPORTUNITY" insight.*

---

## 👨‍🏫 Educational Value
This project demonstrates:
- Integration of Data Science into Management Control.
- Building reactive UI/UX for Decision Support Systems.
- Full-stack application architecture (Frontend, Backend, Database).
