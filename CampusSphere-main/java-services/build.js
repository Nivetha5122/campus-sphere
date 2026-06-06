#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const cwd = __dirname;
const SRC = path.join(cwd, "src");
const OUT = path.join(cwd, "out");
const MAIN = "com.campussphere.gateway.ApiGateway";

const isWin = process.platform === "win32";

function tryRun(cmd, args) {
  try {
    return spawnSync(cmd, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    return { error: e };
  }
}

function findJavaTool(name) {
  // 1) try on PATH
  let res = tryRun(name, ["-version"]);
  if (!res.error) return name;

  // 2) try JAVA_HOME / JDK_HOME
  const javaHome = process.env.JAVA_HOME || process.env.JDK_HOME;
  if (javaHome) {
    const candidate = path.join(javaHome, "bin", isWin ? `${name}.exe` : name);
    if (fs.existsSync(candidate)) return candidate;
  }

  // 3) On Windows, search ProgramFiles\Java for jdks
  if (isWin) {
    const prog = process.env["ProgramFiles"];
    const prog86 = process.env["ProgramFiles(x86)"];
    const roots = [prog, prog86]
      .filter(Boolean)
      .map((p) => path.join(p, "Java"));
    for (const root of roots) {
      if (!fs.existsSync(root)) continue;
      for (const child of fs.readdirSync(root)) {
        const candidate = path.join(root, child, "bin", `${name}.exe`);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  return null;
}

// Resolve tools
const JAVAC = findJavaTool("javac");
const JAR = findJavaTool("jar");
if (!JAVAC) {
  console.error("`javac` not found on PATH and JAVA_HOME not set to a JDK.");
  console.error(
    "Please install JDK 21 and ensure `javac` is available, or set the JAVA_HOME environment variable to your JDK installation.",
  );
  console.error(
    "Download: https://jdk.java.net/21/ or use your OS package manager.",
  );
  process.exit(1);
}

// Check javac version
const check = tryRun(JAVAC, ["-version"]);
const verOut = (check.stdout || "") + (check.stderr || "");
const m = verOut.match(/javac\s+(\d+)(?:\.(\d+))?/i);
let major = null;
if (m) {
  major = parseInt(m[1], 10);
  if (major === 1 && m[2]) major = parseInt(m[2], 10);
}
if (major && major < 21) {
  console.error(`Detected javac version: ${verOut.trim()}`);
  console.error("This project requires JDK 21 (uses virtual threads).");
  console.error(
    "Please install JDK 21 and ensure `javac` on PATH points to it, or set JAVA_HOME to a JDK 21 installation.",
  );
  process.exit(1);
}

function collectJavaFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results = results.concat(collectJavaFiles(full));
    else if (e.isFile() && full.endsWith(".java")) results.push(full);
  }
  return results;
}

if (!fs.existsSync(SRC)) {
  console.error("Source directory not found:", SRC);
  process.exit(1);
}

const sources = collectJavaFiles(SRC);
if (!sources.length) {
  console.error("No .java files found under", SRC);
  process.exit(1);
}

console.log("=== Building CampusSphere Java Services ===");
console.log("Compiling:", sources.join(" "));

fs.mkdirSync(OUT, { recursive: true });

const javacArgs = ["-d", OUT, ...sources];
const javac = spawnSync(JAVAC, javacArgs, { cwd, stdio: "inherit" });
if (javac.error) {
  console.error("Failed to start javac:", javac.error.message || javac.error);
  process.exit(1);
}
if (javac.status !== 0) {
  console.error(
    "Java compilation failed. Ensure a JDK is installed and on PATH.",
  );
  process.exit(javac.status || 1);
}

console.log("Creating JAR...");
const jarArgs = [
  "--create",
  "--file=campussphere-services.jar",
  `--main-class=${MAIN}`,
  "-C",
  OUT,
  ".",
];
if (!JAR) {
  console.error(
    "`jar` tool not found. Ensure your JDK installation includes the `jar` command and JAVA_HOME is set.",
  );
  process.exit(1);
}
const jar = spawnSync(JAR, jarArgs, { cwd, stdio: "inherit" });
if (jar.error) {
  console.error("Failed to run jar:", jar.error.message || jar.error);
  process.exit(1);
}
if (jar.status !== 0) {
  console.error("jar command failed");
  process.exit(jar.status || 1);
}

console.log("\n=== Build complete: campussphere-services.jar ===");
console.log("Run with: java -jar campussphere-services.jar");
