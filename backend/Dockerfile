# syntax=docker/dockerfile:1

# Build stage
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -e -DskipTests package

# Runtime stage
FROM eclipse-temurin:17-jre
ENV JAVA_OPTS=""
WORKDIR /app

# Copy the built jar
COPY --from=build /app/target/backend-*.jar /app/app.jar

# Copy certificates (Aiven CA) for JDBC sslCa usage in container
COPY certs /app/certs

# The platform (e.g., Vercel) will set PORT; Spring reads server.port from env
ENV PORT=8000
EXPOSE 8000

# Health: print Java version
RUN java -version

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
