import type { ScenarioDefinition } from "../core/types.js";
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
export function validateScenario(value: unknown): ScenarioDefinition {
  if (!isRecord(value)) throw new Error("scenario root must be an object");
  if (value.schemaVersion !== 1) throw new Error("unsupported scenario schemaVersion");
  for (const key of ["id", "version", "title", "startHostId"] as const) {
    if (typeof value[key] !== "string" || value[key].trim() === "") throw new Error(`scenario.${key} must be a non-empty string`);
  }
  if (!isRecord(value.company) || typeof value.company.name !== "string" || typeof value.company.slogan !== "string") throw new Error("scenario.company is invalid");
  if (!Array.isArray(value.banner) || !value.banner.every((line) => typeof line === "string")) throw new Error("scenario.banner must be an array of strings");
  if (!isRecord(value.generation) || !isRecord(value.generation.variables)) throw new Error("scenario.generation.variables must be an object");
  if (!Array.isArray(value.hosts) || value.hosts.length === 0) throw new Error("scenario.hosts must contain at least one host");
  const hostIds = new Set<string>();
  for (const host of value.hosts) {
    if (!isRecord(host) || typeof host.id !== "string") throw new Error("host.id is required");
    if (hostIds.has(host.id)) throw new Error(`duplicate host id: ${host.id}`);
    hostIds.add(host.id);
    if (!Array.isArray(host.users) || !Array.isArray(host.files)) throw new Error(`host ${host.id} must define users and files`);
  }
  if (!hostIds.has(value.startHostId as string)) throw new Error(`start host not found: ${value.startHostId}`);
  if (value.events !== undefined && !Array.isArray(value.events)) throw new Error("scenario.events must be an array");
  return value as unknown as ScenarioDefinition;
}
