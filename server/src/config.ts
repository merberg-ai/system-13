import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export interface System13Config {
  server: {
    bind: string;
    port: number;
  };
  game: {
    title: string;
  };
  maintenance: {
    enabled: boolean;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
  };
}

const DEFAULT_CONFIG: System13Config = {
  server: {
    bind: "127.0.0.1",
    port: 1313
  },
  game: {
    title: "SYSTEM 13"
  },
  maintenance: {
    enabled: false
  },
  logging: {
    level: "info"
  }
};

function assertPort(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error("server.port must be an integer between 1 and 65535");
  }
  return Number(value);
}

function assertString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
}

function assertBoolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${name} must be true or false`);
  }
  return value;
}

export function validateConfig(raw: unknown): System13Config {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("configuration root must be a mapping");
  }

  const source = raw as Record<string, unknown>;
  const server = (source.server ?? {}) as Record<string, unknown>;
  const game = (source.game ?? {}) as Record<string, unknown>;
  const maintenance = (source.maintenance ?? {}) as Record<string, unknown>;
  const logging = (source.logging ?? {}) as Record<string, unknown>;

  const level = logging.level ?? DEFAULT_CONFIG.logging.level;
  if (!["debug", "info", "warn", "error"].includes(String(level))) {
    throw new Error("logging.level must be debug, info, warn, or error");
  }

  return {
    server: {
      bind: assertString(server.bind ?? DEFAULT_CONFIG.server.bind, "server.bind"),
      port: assertPort(server.port ?? DEFAULT_CONFIG.server.port)
    },
    game: {
      title: assertString(game.title ?? DEFAULT_CONFIG.game.title, "game.title")
    },
    maintenance: {
      enabled: assertBoolean(
        maintenance.enabled ?? DEFAULT_CONFIG.maintenance.enabled,
        "maintenance.enabled"
      )
    },
    logging: {
      level: String(level) as System13Config["logging"]["level"]
    }
  };
}

export function resolveConfigPath(): string {
  const configured = process.env.SYSTEM13_CONFIG;
  if (configured && configured.trim() !== "") {
    return path.resolve(configured);
  }

  const local = path.resolve("config.yaml");
  if (fs.existsSync(local)) {
    return local;
  }

  return path.resolve("config.example.yaml");
}

export function loadConfig(configPath = resolveConfigPath()): System13Config {
  if (!fs.existsSync(configPath)) {
    throw new Error(`configuration file not found: ${configPath}`);
  }

  const text = fs.readFileSync(configPath, "utf8");
  const parsed = YAML.parse(text);
  return validateConfig(parsed);
}
