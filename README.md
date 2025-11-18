Here is a clean, professional **README.md** tailored to the specific architecture and goals we discussed. You can drop this directly into the root of your project folder.

-----

````markdown
# The AI Exchange

**The AI Exchange** is an internal platform designed for [School Name] to facilitate the discovery, sharing, and discussion of Artificial Intelligence use cases in a business school environment. 

The goal is to connect staff who are experimenting with AI ("The Spark") with those looking for guidance, while offering a safe ("Verified Anonymity") space to share failures and successes.

## 🚀 Project Overview

This is a full-stack web application built to run on a self-hosted VPS. It features a unified feed where staff can post three distinct types of resources:
1. **Use Cases:** Full stories/case studies of AI in teaching or research.
2. **Prompts:** Quick copy-paste blocks of text/code for specific tools.
3. **Policies:** Official or classroom-level governance documents.

### Key Features
* **Unified Feed:** Filters content by type, discipline (Marketing, Finance, etc.), or tool.
* **Verified Anonymity:** Staff can post anonymously to reduce anxiety. Admins see the real identity, but the public frontend hides it.
* **Smart Connections:** Non-anonymous posts display the author's profile and deep links (Email/Teams) to encourage collaboration.
* **Auto-Tagging (NLP):** Uses `YAKE` (lightweight NLP) to automatically extract keywords from descriptions, keeping the server load low.
* **Domain Locking:** Authentication is restricted strictly to `@school.edu` email addresses.

## 🛠 Tech Stack

### Backend
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
* **Database:** PostgreSQL (Production) / SQLite (Dev/MVP)
* **ORM:** SQLModel (Pydantic + SQLAlchemy)
* **NLP:** `rake-nltk` or `YAKE` (Zero-dependency keyword extraction)
* **Authentication:** OAuth2 (Google/Microsoft) with Domain Whitelisting

### Frontend
* **Framework:** React (via Vite)
* **Language:** TypeScript
* **UI Library:** Chakra UI / Mantine
* **State:** React Query (TanStack Query)

---

## ⚡️ Quick Start (Local Development)

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the server with hot-reload
uvicorn app.main:app --reload
````

The API will be available at `http://localhost:8000`.
API Docs (Swagger) are at `http://localhost:8000/docs`.

### 2\. Frontend Setup

Navigate to the frontend directory.

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

-----

## 🔐 Configuration (.env)

Create a `.env` file in the `backend/` directory with the following variables:

```ini
# General
PROJECT_NAME="The AI Exchange"
API_V1_STR="/api/v1"
SECRET_KEY="change_this_to_a_secure_random_string"

# Database
# For MVP, you can use SQLite: "sqlite:///./ai_exchange.db"
DATABASE_URL="postgresql://user:password@localhost/dbname"

# Authentication
ALLOWED_DOMAINS=["myschool.edu", "university.ac.uk"]
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Mail (For Notifications)
MAIL_USERNAME=""
MAIL_PASSWORD=""
MAIL_FROM="no-reply@school.edu"
MAIL_SERVER="smtp.school.edu"
```

## 🏗 Architecture Decisions

### The "Resource" Model

To keep the database simple for the MVP, we use **Single Table Inheritance**. Prompts, Stories, and Policies are all stored in the `resources` table, distinguished by a `type` enum.

### Verified Anonymity Logic

The database *always* records the `user_id`. The API response serializer handles the privacy logic:

  * If `is_anonymous=True` → Return "Faculty Member" & `null` avatar.
  * If `is_anonymous=False` → Return `user.full_name` & `user.avatar`.

## 🚢 Deployment (VPS)

This project includes a `docker-compose.yml` for easy deployment on a Linux VPS (DigitalOcean/Linode/Internal).

```bash
# Build and run containers
docker-compose up -d --build
```

## 📄 License

Internal Use Only.

```
```
