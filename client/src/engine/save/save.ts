import type { RunSave } from "../core/types.js";
import type { GameEngine } from "../core/engine.js";
export const ENGINE_VERSION = "0.1";
export function makeSave(engine: GameEngine, createdAt?: string): RunSave { const now = new Date().toISOString(); return { saveVersion: 1, engineVersion: ENGINE_VERSION, scenarioId: engine.world.scenarioId, scenarioVersion: engine.world.scenarioVersion, seed: engine.world.seed, createdAt: createdAt ?? now, updatedAt: now, state: structuredClone(engine.state) }; }
export function assertCompatibleSave(save: RunSave): void { if (save.saveVersion !== 1) throw new Error(`unsupported save version: ${save.saveVersion}`); if (!save.scenarioId || !save.seed || !save.state) throw new Error("save is incomplete"); }
