# CloudLab Simulation Platform

This is a full-stack web application featuring a React (Vite) frontend and a Python (Flask) backend with Role-Based Access Control, a dashboard, and simulated resource management.

## Prerequisites

Before running the application, ensure you have the following installed on your machine:
- **Node.js** (v18+ recommended) - For the frontend
- **Python** (v3.8+ recommended) - For the backend

---

## 1. Setting up the Backend (Flask)

The backend provides the API, database connectivity (SQLite), and JWT authentication.

1. **Open a terminal** and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. **Create a virtual environment** (Recommended to keep dependencies isolated):
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - On **Windows**:
     ```bash
     .\venv\Scripts\activate
     ```
   - On **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Flask server**:
   ```bash
   python app.py
   ```
   *The backend server should now be running at `http://127.0.0.1:5000`.*

> **Note:** The SQLite database (`instance/cloudlab.db`) is automatically created when you run `app.py` for the first time. The default admin account (ID: `admin`, Password: `password`) was also pre-seeded during development.

---

## 2. Setting up the Frontend (React + Vite)

The frontend is built with React 19, Vite, and Tailwind CSS.

1. **Open a NEW terminal window** (keep the backend running in the first one) and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install the Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend server will start up. Check your terminal output for the exact URL, but it is usually `http://localhost:5173`.*

---

## 3. Using the App

1. Open your web browser and go to `http://localhost:5173`.
2. You will be greeted by the User Login screen.
3. **To login as Admin**:
   - Click the "Are you an administrator? Sign in here." link at the bottom.
   - Enter **Admin ID**: `admin`
   - Enter **Passcode**: `password`
   - Explore the exclusive Admin Dashboard and User Management panel!
4. **To login as a Normal User**:
   - Register a new account via the frontend, and sign in!
