@echo off
setlocal

set "DATA_DIR=.\data"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

if not exist "campussphere-services.jar" (
  echo JAR not found. Running build first...
  call build.bat
)

echo Starting CampusSphere API Gateway on port 8080...
java -Xms64m -Xmx256m -Djava.util.logging.SimpleFormatter.format="%%1$tT [%%4$s] %%2$s - %%5$s%%6$s%%n" -Ddata.dir="%DATA_DIR%" -jar campussphere-services.jar
