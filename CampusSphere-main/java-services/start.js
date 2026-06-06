#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const cwd = path.join(__dirname);
const isWin = process.platform === "win32";
const cmd = isWin ? "cmd" : "bash";
const args = isWin ? ["/c", "start.bat"] : ["start.sh"];

function tryRun(cmdName, args) {
  try {
    return spawnSync(cmdName, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    return { error: e };
  }
}

function findJavaTool() {
  // 1) try on PATH
  let res = tryRun("java", ["-version"]);
  if (!res.error) return "java";

  // 2) try JAVA_HOME / JDK_HOME
  const javaHome = process.env.JAVA_HOME || process.env.JDK_HOME;
  if (javaHome) {
    const candidate = path.join(javaHome, "bin", isWin ? "java.exe" : "java");
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
        const candidate = path.join(root, child, "bin", "java.exe");
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  return null;
}

const JAVA = findJavaTool();
if (!JAVA) {
  console.error("`java` not found on PATH and JAVA_HOME not set to a JDK.");
  console.error(
    "Install JDK 21 and ensure `java` is available on PATH, or set JAVA_HOME to your JDK installation.",
  );
  console.error("Download: https://jdk.java.net/21/ or https://adoptium.net/");
  process.exit(1);
}

// Check java version
const check = tryRun(JAVA, ["-version"]);
const verOut = (check.stdout || "") + (check.stderr || "");
const m = verOut.match(/version\s+"?(\d+)(?:\.(\d+))?/i);
let major = null;
if (m) major = parseInt(m[1], 10);
if (major && major < 21) {
  console.error(`Detected java version: ${verOut.trim()}`);
  console.error("This project requires JDK 21 (uses virtual threads).");
  console.error(
    "Please install JDK 21 and ensure `java` on PATH points to it.",
  );
  process.exit(1);
}

const child = spawn(cmd, args, { cwd, stdio: "inherit" });
child.on("exit", (code) => process.exit(code));
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
