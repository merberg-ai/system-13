import path from "node:path";
import { loadConfig } from "./config.js";

declare const __SYSTEM13_VERSION__: string;

const supplied = process.argv[2];
const configPath = supplied ? path.resolve(supplied) : undefined;

try {
  const config = loadConfig(configPath);
  console.log(`SYSTEM 13 ${__SYSTEM13_VERSION__}`);
  console.log("Configuration valid.");
  console.log(
    `Bind: ${config.server.bind}:${config.server.port} | Maintenance: ${config.maintenance.enabled ? "on" : "off"}`
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Configuration invalid: ${message}`);
  process.exitCode = 1;
}
