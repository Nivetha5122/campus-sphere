@echo off
setlocal

echo === Building CampusSphere Java Services ===

set SRC=src
set OUT=out
set MAIN=com.campussphere.gateway.ApiGateway

if exist %OUT% rmdir /s /q %OUT%
mkdir %OUT%

echo Compiling sources...

if exist sources.txt del sources.txt
dir /s /b %SRC%\*.java > sources.tmp
for /F "usebackq tokens=*" %%A in ("sources.tmp") do (
    set "F=%%A"
    setlocal EnableDelayedExpansion
    echo "!F:\=/!" >> sources.txt
    endlocal
)
del sources.tmp

javac -d %OUT% @sources.txt
if errorlevel 1 (
  echo Compilation failed
  exit /b %errorlevel%
)

echo Creating JAR...

jar --create --file=campussphere-services.jar --main-class=%MAIN% -C %OUT% .

echo === Build complete ===