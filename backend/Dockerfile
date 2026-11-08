# Multi-stage build for EchoVault Backend
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy Maven files and dependencies
COPY pom.xml mvnw.cmd ./
COPY src ./src

# Build JAR package
RUN ./mvnw.cmd package -DskipTests=true || mvn package -DskipTests=true

# Runtime Stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=build /app/target/echovault-backend-1.0.0-SNAPSHOT.jar app.jar
RUN mkdir -p /app/storage /app/data

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
