# Deploy backend to Render (Docker)

This project includes a Dockerfile for the backend, so Render can build & run it directly.

## 1) Repo setup
- Ensure your code is on GitHub (public or private) and connect it to Render.
- Keep secrets out of git. Use Render Environment Variables.

## 2) Create a Web Service
- In Render, create a New Web Service and select this repo.
- Select the `backend` directory as the root (Render auto-detects via render.yaml if present).
- Render will build using the Dockerfile in `backend/`.

## 3) Environment variables
Set these under the service Settings → Environment:

Required (from Aiven):
- SPRING_DATASOURCE_URL =
	- Option A (simplest): jdbc:mysql://<HOST>:<PORT>/<DB>?sslMode=REQUIRED&enabledTLSProtocols=TLSv1.2,TLSv1.3
	- Option B (strict CA validation): jdbc:mysql://<HOST>:<PORT>/<DB>?sslMode=VERIFY_CA&sslCa=/app/certs/aiven-mysql-ca.pem&enabledTLSProtocols=TLSv1.2,TLSv1.3
- SPRING_DATASOURCE_USERNAME = <USER>
- SPRING_DATASOURCE_PASSWORD = <PASSWORD>

App:
- JWT_SECRET = <strong-random-32+>
- SPRING_SQL_INIT_MODE = always (first deploy) → change to `never` later to avoid re-running schema
- CORS_ALLOWED_ORIGINS = https://<your-frontend>.onrender.com

Note on SSL:
- Using `sslMode=REQUIRED` is simplest on Render (no certs to manage).
- If you prefer `VERIFY_CA`, you can now provide the Aiven CA via env using base64:
	- Set `MYSQL_SSL_CA_PEM_B64` to the base64 of your Aiven CA PEM
	- The image startup writes it to `/app/certs/aiven-mysql-ca.pem`
	- Use `sslCa=/app/certs/aiven-mysql-ca.pem` in your JDBC URL
	- Do NOT set `JAVA_TOOL_OPTIONS` with a Windows path in Render

## 4) Ports
- Render provides the PORT env var. The Dockerfile exposes 8000, and Spring reads server.port from PORT.

## 5) First deploy & verify
- Open Logs and confirm startup connects to Aiven host (not localhost).
- Hit the app’s URL path `/api/users` (or authenticate via frontend) to test.

## 6) After initial tables are created
- Set SPRING_SQL_INIT_MODE=never and redeploy.

## 7) Troubleshooting
- 403/CORS issues: re-check CORS_ALLOWED_ORIGINS matches your frontend URL exactly.
- DB connection failures: verify host/port/user/pass and that your Aiven service allows the Render egress IPs.
