# Ledgerly — Phase 1 & Phase 2: Spring Boot Backend & Next.js Frontend
A robust financial application consisting of a secure Spring Boot backend and a modern Next.js frontend, featuring JWT authentication, account management, transaction processing, and automated balance tracking.

# 🚀 Features
User Authentication & Authorization: Secure signup and login powered by Spring Security, JSON Web Tokens (JWT), and modern frontend auth flows.

Account Entity & Management: Create and manage bank accounts linked to users, supporting names, balances, and multi-currency structures.

Transaction Engine: Process financial transfers and track transaction history with automated balance updates.

Idempotency Support: Built-in backend mechanisms to safely handle duplicate transaction submissions without risking double-charging or corrupting balances.

Modern UI: Responsive dashboards, transaction forms, and history views built with Next.js and Tailwind CSS.

# 🛠️ Tech Stack
Backend
Language: Java 17+

Framework: Spring Boot

Security: Spring Security, JWT (JSON Web Tokens)

Persistence: Spring Data JPA, Hibernate

Database: H2 / MySQL (configured via application properties)

Build Tool: Maven

# Frontend
Framework: Next.js (React 19)

Styling: Tailwind CSS

Language: TypeScript

# ⚙️ Getting Started & Setup
1. Clone the Repository
Bash
git clone https://github.com/nehamangal/ledgerly.git
cd ledgerly
2. Backend Setup
Configure your src/main/resources/application.properties file with your database and security configurations:

Properties
spring.datasource.url=jdbc:mysql://localhost:3306/ledgerly
spring.datasource.username=root
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT Configuration
jwt.secret=your_jwt_secret_key_here
jwt.expiration=86400000
Build and run the Spring Boot server using Maven:

Bash
mvn clean spring-boot:run
The application will start running on http://localhost:8080.

3. Frontend Setup
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
The application will start running on http://localhost:3000.

# 🔌 API Endpoints Reference
Authentication
POST /api/auth/signup — Register a new user account.

POST /api/auth/login — Authenticate and receive a JWT token.

Accounts
POST /api/accounts — Create a new bank account entity.

GET /api/account/amount — Fetch the current balance of a specific account (?accountName=name).

Transactions
POST /api/transactions — Execute a financial transaction (includes idempotency key header/body validation).

# 🧪 Testing via Postman or Frontend UI
Frontend UI: Launch the Next.js app (npm run dev) to interact with the dashboards, user authentication flows, and transaction forms directly in your browser.

Postman API Testing:

Sign up a user using POST /api/auth/signup.

Log in using POST /api/auth/login to retrieve your Bearer token.

Pass the token in the Authorization header (Bearer <token>) to test authenticated account creation, balance lookups, and transaction flows.
