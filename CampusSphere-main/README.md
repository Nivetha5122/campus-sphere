# CampusSphere — Full Stack Academic Platform

## Architecture

```
Browser → Java API Gateway (8080) → Node.js Backend (5000) → MongoDB
                ↕                          ↕
         PersistentLRUCache          NotificationService
         MessageQueue                EventEmitter (pub/sub)
```

## Quick Start

### Prerequisites

- Node.js 18+
- Java 21+ (JDK with javac)
- MongoDB running locally

### One-time setup

```bash
cd CampusSphere
npm run setup       # installs node deps + builds Java JAR
```

### Create .env files

**backend/.env**

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/campussphere
JWT_SECRET=change_this_secret_key_123
NODE_ENV=development
```

**frontend/.env**

```
VITE_API_URL=http://localhost:8080/api/v1
VITE_GOOGLE_MAPS_KEY=optional
```

### Run everything

```bash
npm run dev
```

- Java Gateway → http://localhost:8080
- Node API → http://localhost:5000
- Frontend → http://localhost:5173

### First Admin

```js
// In MongoDB shell after registering normally:
db.users.updateOne({ email: "admin@campus.edu" }, { $set: { role: "admin" } });
```

## Java Services

Build manually:

```bash
cd java-services
./build.sh          # compiles all Java sources → campussphere-services.jar
./start.sh          # runs the gateway
```

Gateway stats: http://localhost:8080/gateway/stats
Gateway health: http://localhost:8080/gateway/health

### If javac not found

Install JDK (not just JRE):

```bash
# Ubuntu/Debian
sudo apt install default-jdk

# Windows: install JDK from https://adoptium.net
```


