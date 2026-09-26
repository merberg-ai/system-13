import type { ScenarioDefinition } from "../core/types.js";
import { validateScenario } from "./validate.js";
export interface ScenarioIndexEntry { id: string; path: string; }
export async function loadScenarioIndex(): Promise<ScenarioIndexEntry[]> {
  const response = await fetch("/scenarios/index.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`unable to load scenario index: ${response.status}`);
  const value = await response.json() as unknown;
  if (!Array.isArray(value)) throw new Error("scenario index is invalid");
  return value as ScenarioIndexEntry[];
}
export async function loadScenario(id: string): Promise<ScenarioDefinition> {
  const index = await loadScenarioIndex();
  const entry = index.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`scenario not found: ${id}`);
  const response = await fetch(entry.path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`unable to load scenario ${id}: ${response.status}`);
  return validateScenario(await response.json());
}
