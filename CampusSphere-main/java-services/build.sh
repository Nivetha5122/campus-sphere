#!/bin/bash
set -e
echo "=== Building CampusSphere Java Services ==="

SRC=src
OUT=out
MAIN=com.campussphere.gateway.ApiGateway

mkdir -p $OUT

# Find all .java files
SOURCES=$(find $SRC -name "*.java")
echo "Compiling: $SOURCES"

javac -d $OUT $SOURCES || {
	echo "Java compilation failed. Ensure a JDK is installed and on PATH."
	echo "If you need Java 21 features, install JDK 21 or run the build from WSL/Git Bash with a compatible JDK."
	exit 1
}

echo "Creating JAR..."
jar --create --file=campussphere-services.jar --main-class=$MAIN -C $OUT .

echo ""
echo "=== Build complete: campussphere-services.jar ==="
echo "Run with: java -jar campussphere-services.jar"
