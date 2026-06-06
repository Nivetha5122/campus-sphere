FROM eclipse-temurin:17-jre
WORKDIR /app
COPY campussphere-services.jar app.jar
RUN mkdir -p data
CMD ["java", "-Ddata.dir=./data", "-jar", "app.jar"]