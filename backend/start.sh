#!/usr/bin/env sh
set -e

# If provided, write the MySQL CA PEM to a file for the JDBC driver
if [ -n "$MYSQL_SSL_CA_PEM_B64" ]; then
  mkdir -p /app/certs
  echo "$MYSQL_SSL_CA_PEM_B64" | base64 -d > /app/certs/aiven-mysql-ca.pem
elif [ -n "$MYSQL_SSL_CA_PEM" ]; then
  mkdir -p /app/certs
  echo "$MYSQL_SSL_CA_PEM" > /app/certs/aiven-mysql-ca.pem
fi

exec java $JAVA_OPTS -jar /app/app.jar
