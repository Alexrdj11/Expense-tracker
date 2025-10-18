# XP — Expense Tracker

A minimal, fast, and privacy‑first expense tracker. Frontend is React (Vite + TypeScript). Backend is Spring Boot (Java 17) with JWT auth and a PDF importer tuned for common Indian statements.

Highlights
- Clean two-page landing with smooth scroll
- Email/password auth (no Google login)
- JWT-protected API
- Expense dashboard with presets and custom date range
- PDF import (PhonePe, SuperMoney formats) with preview mode
- Lightweight UI animations (landing + auth pages)

Tech stack
- Frontend: React 18, Vite, TypeScript, Chart.js, CSS modules
- Backend: Spring Boot 3, Spring Web, Spring Security, Spring Data, Maven
- PDF: Apache PDFBox
- Auth: JWT
- Node 18+, Java 17+, Maven 3.9+

Monorepo layout
- frontend/ — React app (Vite)
- backend/ — Spring Boot API

Getting started (Windows)
1) Prerequisites
- Node 18+ and npm
- Java 17+
- Maven 3.9+

2) Backend (port 8000)
```powershell
cd f:\expense_tracker\backend

# one time: set a strong secret (32+ chars) for this terminal
$env:JWT_SECRET = "change_this_to_a_long_random_secret_32+"

# run in dev
mvn spring-boot:run
```

### Use Aiven MySQL instead of local MySQL
If you provisioned a managed DB (Aiven) and have host/port/db/user/password plus a CA cert:

Option 1 — Quick (encrypted, no CA validation)
```powershell
cd f:\expense_tracker\backend
$env:SPRING_DATASOURCE_URL="jdbc:mysql://<HOST>:<PORT>/<DBNAME>?sslMode=REQUIRED&enabledTLSProtocols=TLSv1.2,TLSv1.3"
$env:SPRING_DATASOURCE_USERNAME="<USER>"
$env:SPRING_DATASOURCE_PASSWORD="<PASSWORD>"
$env:JWT_SECRET="change_this_to_a_long_random_secret_32_plus"
mvn spring-boot:run
```

Option 2 — Secure (VERIFY_CA)
```powershell
# Place your CA at backend/certs/aiven-mysql-ca.pem and create a truststore (see backend/certs/README.md)
cd f:\expense_tracker\backend
$env:JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStore=f:\expense_tracker\backend\certs\aiven-mysql-ca.jks -Djavax.net.ssl.trustStorePassword=changeit"
$env:SPRING_DATASOURCE_URL="jdbc:mysql://<HOST>:<PORT>/<DBNAME>?sslMode=VERIFY_CA&enabledTLSProtocols=TLSv1.2,TLSv1.3"
$env:SPRING_DATASOURCE_USERNAME="<USER>"
$env:SPRING_DATASOURCE_PASSWORD="<PASSWORD>"
$env:JWT_SECRET="change_this_to_a_long_random_secret_32_plus"
mvn spring-boot:run
```

Tip: copy `backend/.env.aiven.example` to `backend/.env`, fill values, and run `backend\run.ps1` to auto-load the env.

3) Frontend (port 5173)
```powershell
cd f:\expense_tracker\frontend
npm install
npm run dev
```
Open http://localhost:5173

Auth flow
- Sign up with username + password.
- On success you stay on landing; press Start tracking to go to the app.
- Login issues? Ensure JWT secret is set and the backend is running.

Key routes
- Landing: /
- Login: /login
- Register: /register
- App (tracker): /app
- Import: /import

API overview
- POST /api/auth/login
  - Body: { "username": "...", "password": "..." }
  - 200: { "token": "JWT" }
- POST /api/users/register
  - Body: { "username": "...", "password": "..." }
  - 200: created user
- GET /api/expenses
  - Bearer token required
- POST /api/expenses
  - Create expense
- POST /api/expenses/import/pdf?preview=false
  - multipart/form-data with file=<pdf>, returns import counts

PDF import
- Supported sources (text-based PDFs; scanned images are not supported):
  - PhonePe statements
  - SuperMoney “Transaction History” export (Name Bank Amount Date Status)
- Preview mode shows parsed lines without saving:
```bash
curl -H "Authorization: Bearer <JWT>" ^
  -F "file=@statement.pdf" ^
  "http://localhost:8000/api/expenses/import/pdf?preview=true"
```
- Import mode saves detected debit transactions (credits are skipped):
```bash
curl -H "Authorization: Bearer <JWT>" ^
  -F "file=@statement.pdf" ^
  "http://localhost:8000/api/expenses/import/pdf?preview=false"
```

Tracker page
- Presets: 15/30/90 days
- Custom range: choose From/To dates
- Daily spend bar chart aligns with current range
- Recent expenses list filtered by range

Configuration
- Backend environment (PowerShell):
  - JWT secret (required)
    - $env:JWT_SECRET="a_very_long_random_secret_value"
  - Server port (optional; defaults may vary)
    - $env:SERVER_PORT="8000"
- application.properties (already configured in repo). Override with env vars as needed.

Build for production
- Frontend
```powershell
cd f:\expense_tracker\frontend
npm run build
# serves static files from dist/ (serve with any static server or reverse proxy)
```
- Backend
```powershell
cd f:\expense_tracker\backend
mvn -DskipTests package
java -jar target\backend-*.jar
```

Troubleshooting
- “White page” after import: Check browser console/network. The importer returns JSON with { imported, failed, skipped, errors }. Ensure the PDF is text-based (not scanned).
- Login succeeds but redirects to landing: Intended. Use Start tracking → to enter the app. If Start tracking loops, verify the /app route exists and token is in localStorage.
- CORS in dev: The frontend dev server is expected to proxy or call the same origin. If calling http://localhost:8000 directly from the browser, ensure CORS is allowed or use a dev proxy.

Accessibility and motion
- Landing/auth animations respect prefers-reduced-motion and will reduce or stop effects for users who prefer minimal motion.

Attributions
- UI inspiration from modern, minimalist landing designs
- Emoji/iconography are native system glyphs

License
- MIT (add a LICENSE file if you want it explicit)

Developed by Harsha • version: v0.01