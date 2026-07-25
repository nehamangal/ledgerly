# Ledgerly — Phase 1: Spring Boot Backend
A robust financial transaction and account management service built with Spring Boot, featuring secure user authentication via JWT, idempotent transaction processing, and dynamic account balance tracking.

# 🚀 Features
User Authentication & Authorization: Secure signup and login endpoints powered by Spring Security and JSON Web Tokens (JWT).

Account Entity & Management: Create and manage bank accounts linked to users, supporting names, balances, and multi-currency structures.

Transaction Engine: Process financial transfers (money in/out) with automated balance updates.

Idempotency Support: Built-in mechanisms to safely handle duplicate transaction submissions without risking double-charging or corrupting balances.

# 🛠️ Tech Stack
Language: Java 17+

Framework: Spring Boot

Security: Spring Security, JWT (JSON Web Tokens)

Persistence: Spring Data JPA, Hibernate

Database: H2 / MySQL (configured via application properties)

Build Tool: Maven

# ⚙️ Getting Started & Setup
1. Clone the Repository
Bash
git clone https://github.com/your-username/ledgerly.git
cd ledgerly
2. Configure Properties
Create or update your src/main/resources/application.properties file with your database and security configurations:

Properties
spring.datasource.url=jdbc:mysql://localhost:3306/ledgerly
spring.datasource.username=root
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT Configuration
jwt.secret=your_jwt_secret_key_here
jwt.expiration=86400000
3. Build and Run the Application
Use Maven to clean, compile, and run the Spring Boot server:

Bash
mvn clean spring-boot:run
The application will start running on http://localhost:8080.

# 🔌 API Endpoints Reference
Authentication
POST /api/auth/signup — Register a new user account.

POST /api/auth/login — Authenticate and receive a JWT token.

Accounts
POST /api/accounts — Create a new bank account entity.

GET /api/account/amount — Fetch the current balance of a specific account (?accountName=name).

Transactions
POST /api/transactions — Execute a financial transaction (includes idempotency key header/body validation).

# 🧪 Testing via Postman
Sign up a user using POST /api/auth/signup.

Log in using POST /api/auth/login to retrieve your Bearer token.

Pass the token in the Authorization header (Bearer <token>) to test authenticated account creation, balance lookups, and transaction flows.
