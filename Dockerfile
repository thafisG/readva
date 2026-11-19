FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY backend/ backend/
RUN mvn -B -f backend/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/backend/target/readva-api-0.0.1-SNAPSHOT.jar /app/readva-api.jar
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0"
EXPOSE 10000
ENTRYPOINT ["sh", "-c", "exec java -jar /app/readva-api.jar --server.port=${PORT:-10000}"]
