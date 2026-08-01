# Ledgerly — Full-Stack Financial Ledger Application
A production-grade financial ledger application built with a high-performance **Spring Boot** backend, an intelligent **Django** analytics engine, and a sleek **Next.js** frontend. It features secure JWT authentication, multi-currency account management, idempotent transaction processing, recurring subscription detection, and automated trend insights.

---

# 🚀 Core Features
* **Multi-Service Architecture:** 
  * **Spring Boot Core:** Handles core transactional processing, accounts, idempotency, and security.
  * **Django Analytics Service:** Powered by AI/heuristic processing to automatically detect recurring subscriptions and financial anomalies.
* **Secure Authentication:** Robust sign-up and login workflows secured by Spring Security, JSON Web Tokens (JWT), and stateful filters.
* **Account Entity & Management:** Create, view, and manage bank accounts linked to users with multi-currency tracking (INR, USD, etc.).
* **Advanced Transaction Engine:** Execute expenses, incomes, and account-to-account transfers with real-time balance propagation.
* **Idempotency Protection:** Backend support via custom idempotency headers to safely prevent duplicate transaction submissions.
* **Interactive Dashboard & Charts:** Client-side dynamic breakdowns including **Spending by Category** and **Monthly Trend (In vs Out)** paired with clean Tailwind CSS styling.

---

# 🛠️ Tech Stack

### Backend (Core)
* **Language:** Java 17+
* **Framework:** Spring Boot
* **Security:** Spring Security, JWT
* **Persistence:** Spring Data JPA, Hibernate
* **Database:** MySQL / H2
* **Build Tool:** Maven

### Analytics Engine
* **Framework:** Django / Django REST Framework
* **Integration:** REST client fetching transaction summaries for subscription and anomaly profiling.

### Frontend
* **Framework:** Next.js (App Router, React)
* **Styling:** Tailwind CSS
* **Language:** JavaScript / TypeScript

---

# ⚙️ Getting Started & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/nehamangal/ledgerly.git
cd ledgerly
```

### 2. Spring Boot Backend Setup
Configure your src/main/resources/application.properties file:

Properties
spring.datasource.url=jdbc:mysql://localhost:3306/ledgerly
spring.datasource.username=root
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT Configuration
jwt.secret=your_jwt_secret_key_here
jwt.expiration=86400000

# CORS Production / Dev Fallbacks
FRONTEND_URL=http://localhost:3000
DJANGO_URL=http://localhost:8000

Build and run the Spring Boot server using Maven:

Bash
mvn clean spring-boot:run

The Spring Boot server will run on http://localhost:8080.

3. Django Analytics Engine Setup
Navigate to your Django analyst directory, install requirements, and run migrations:

Bash
cd analyst
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
The Django analytics server will run on http://localhost:8000.

4. Next.js Frontend Setup
Navigate to the frontend directory:

Bash
cd frontend
Install dependencies:

Bash
npm install
Create a .env.local file in the frontend root directory:

Code snippet
NEXT_PUBLIC_API_URL=http://localhost:8080
Run the development server:

Bash
npm run dev
The Next.js dashboard will run on http://localhost:3000.

### 🔌 API Endpoints Reference
Spring Boot Endpoints (http://localhost:8080)
POST /api/auth/signup — Register a new user account.

POST /api/auth/login — Authenticate and receive a JWT token.

GET /api/accounts — Fetch all linked accounts for the authenticated user.

POST /api/account — Create a new bank account entity.

GET /api/transactions?accountId={id} — Fetch historical transactions for a given account.

POST /api/transactions — Execute a financial transaction (supports X-Idempotency-Key header validation).

Django Analytics Endpoints (http://localhost:8000)
GET /api/insight/?accountId={id} — Fetch AI/heuristic-driven subscription items and spending anomaly alerts.

### 🧪 Testing via Postman or Frontend UI
Frontend UI: Launch the Next.js app (npm run dev) to interact with account creation, dynamic category spending charts, live balance metrics, and subscription insights directly in your browser.

Postman API Testing:

Authenticate using POST /api/auth/signup or POST /api/auth/login to retrieve your Bearer token.

Pass the token in the request headers (Authorization: Bearer <token>).

Test transactional integrity, idempotency header behavior, and multi-account balance management.

## Screenshots
## Login Page : 
<img width="2940" height="1758" alt="image" src="https://github.com/user-attachments/assets/7b69b3c0-c141-4372-bc4d-4a25624f07bc" />

## Dashboard : 
<img width="2940" height="1765" alt="image" src="https://github.com/user-attachments/assets/9446236f-fce4-40c0-ac91-1d923604093d" />
<img width="2940" height="1756" alt="image" src="https://github.com/user-attachments/assets/b408a1c8-e629-40ef-b128-0763990a9303" />

