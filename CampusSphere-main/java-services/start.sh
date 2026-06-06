#!/bin/bash
DATA_DIR="./data"
mkdir -p $DATA_DIR

if [ ! -f campussphere-services.jar ]; then
  echo "JAR not found. Running build first..."
  ./build.sh
fi

echo "Starting CampusSphere API Gateway on port 8080..."
java -Xms64m -Xmx256m \
     -Djava.util.logging.SimpleFormatter.format='%1$tT [%4$s] %2$s - %5$s%6$s%n' \
     -Ddata.dir=$DATA_DIR \
     -jar campussphere-services.jar
