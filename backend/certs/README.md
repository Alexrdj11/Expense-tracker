# Certificates for Aiven (MySQL)

If your Aiven service requires SSL verification (recommended), use VERIFY_CA in the JDBC URL and add a Java truststore containing Aiven's CA certificate.

Steps (Windows + PowerShell):

1) Save the CA file
- Place your CA PEM here as `aiven-mysql-ca.pem`.

2) Create a truststore using keytool
- Requires JDK installed and `keytool` available in PATH.

```powershell
cd F:\expense_tracker\backend\certs
keytool -importcert -file aiven-mysql-ca.pem `
  -alias aiven-mysql-ca `
  -keystore aiven-mysql-ca.jks `
  -storepass changeit -noprompt
```

3) Point the JVM at the truststore
- Set this environment variable when starting the backend (or in `.env` via `JAVA_TOOL_OPTIONS`).

```powershell
$env:JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStore=F:\expense_tracker\backend\certs\aiven-mysql-ca.jks -Djavax.net.ssl.trustStorePassword=changeit"
```

4) Use a VERIFY_CA JDBC URL

```
jdbc:mysql://<HOST>:<PORT>/<DBNAME>?sslMode=VERIFY_CA&enabledTLSProtocols=TLSv1.2,TLSv1.3
```

Notes
- For quick dev without validation, you can use `sslMode=REQUIRED` (encryption only). For production, prefer VERIFY_CA.
- Ensure there are no trailing spaces in username/password env vars.
