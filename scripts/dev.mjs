import { spawn } from "node:child_process";

const nextCommand = process.platform === "win32" ? "next.cmd" : "next";
const server = spawn(nextCommand, ["dev", "--hostname", "127.0.0.1"], {
  stdio: ["inherit", "pipe", "inherit"],
  shell: process.platform === "win32",
});

let output = "";
let browserOpened = false;
let localUrl;
let serverReady = false;

server.stdout.setEncoding("utf8");
server.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  output += chunk;

  const address = output.match(/Local:\s+(https?:\/\/[^\s]+)/);
  if (address) {
    localUrl = address[1];
  }
  if (/Ready in \d/.test(output)) {
    serverReady = true;
  }

  if (!browserOpened && localUrl && serverReady) {
    browserOpened = true;
    openBrowser(localUrl);
  }
});

server.on("error", (error) => {
  console.error("Could not start the Next.js development server:", error);
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

function openBrowser(url) {
  const command =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  const browser = spawn(command[0], command[1], {
    detached: true,
    stdio: "ignore",
  });

  browser.on("error", (error) => {
    console.error("Could not open the browser:", error);
  });
  browser.unref();
}
