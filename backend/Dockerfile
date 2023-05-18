FROM maven:3.9.2-eclipse-temurin-20 as build
workdir /app
COPY pom.xml .
RUN mvn dependency:go-offline
RUN mvn compile 
COPY src src
RUN ls
RUN mvn package

FROM eclipse-temurin:20
COPY --from=build /app/target/*.jar .
CMD ["java","-jar","parts-trackr-0.0.1-SNAPSHOT.jar"]

