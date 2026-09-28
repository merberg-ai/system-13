import { GameEngine } from "../engine/core/engine.js";
import type { RunSave } from "../engine/core/types.js";
import { randomSeed, rngStream, runIdFromSeed } from "../engine/rng/rng.js";
import { generateWorld } from "../engine/scenario/generator.js";
import { loadScenario, loadScenarioIndex } from "../engine/scenario/loader.js";
import { assertCompatibleSave, makeSave } from "../engine/save/save.js";
import { SaveStore } from "../engine/save/store.js";
import {
  executeLocalCommand,
  loadLocalClientState,
  localWelcome,
  recordDial,
  registerTarget,
  saveLocalClientState,
  type LocalClientState
} from "../local/shell.js";
import {
  dialKnownTarget,
  dialUnknownTarget,
  planWarDial,
  runWarDial
} from "../presentation/modem.js";
import { SoundEngine } from "../presentation/sound.js";
import { TerminalUI } from "../terminal/terminal.js";

const LOCAL_PROMPT = "operator@system13:~$ ";

type AppMode = "local-shell" | "busy" | "engine" | "new-confirm";

export class System13App {
  private readonly ui = new TerminalUI();
  private readonly sound = new SoundEngine();
  private readonly saves = new SaveStore();
  private readonly local: LocalClientState = loadLocalClientState();
  private engine: GameEngine | null = null;
  private currentSave: RunSave | null = null;
  private currentNumber: string | null = null;
  private mode: AppMode = "local-shell";

  async start(): Promise<void> {
    await this.saves.init();
    this.ui.onSubmit((value) => this.handleSubmit(value));
    document.addEventListener("keydown", () => this.sound.activate(), { once: true });

    try {
      const save = await this.saves.load();
      if (save) {
        assertCompatibleSave(save);
        this.currentSave = save;
        const number = planWarDial(save.seed).successfulNumber;
        const runId = runIdFromSeed(save.seed);
        if (!this.local.targets[number] || this.local.targets[number]?.runId !== runId) {
          registerTarget(this.local, number, runId, save.scenarioId);
          saveLocalClientState(this.local);
        }
        this.currentNumber = number;
        await this.saves.save(save);
        this.showLocalShell("LOCAL SESSION IMAGE DETECTED");
        return;
      }
    } catch (error) {
      this.showLocalShell(`LOCAL SAVE ERROR: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    this.showLocalShell();
  }

  private async handleSubmit(value: string): Promise<void> {
    this.sound.activate();

    if (this.mode === "busy") return;

    if (this.mode === "local-shell") {
      await this.handleLocalCommand(value);
      return;
    }

    if (this.mode === "new-confirm") {
      const expected = `NEW ${this.engine?.world.runId ?? ""}`;
      this.ui.echo("confirm> ", value, false);
      if (value.trim() === expected) {
        await this.scanNewTarget();
      } else {
        this.ui.write("New scan cancelled.");
        this.mode = "engine";
        this.syncPrompt();
      }
      return;
    }

    if (!this.engine) {
      this.showLocalShell("REMOTE SESSION STATE LOST");
      return;
    }

    const normalized = value.trim().toLowerCase();
    const topLevel = this.engine.state.sessionStack.length === 1;

    if (topLevel && ["exit", "logout", "quit"].includes(normalized)) {
      const prompt = this.engine.prompt();
      this.ui.echo(prompt, value, this.engine.maskedInput);
      if (this.engine.state.mode.kind === "shell") {
        const response = this.engine.handleInput("exit");
        this.ui.writeLines(response.lines);
        await this.persist();
      }
      await this.dropCarrier("REMOTE LOGOUT COMPLETE");
      return;
    }

    const prompt = this.engine.prompt();
    const masked = this.engine.maskedInput;
    this.ui.echo(prompt, value, masked);
    const engineInput = normalized === "logout" ? "exit" : value;
    const response = this.engine.handleInput(engineInput);
    if (response.clear) this.ui.clear();
    this.ui.writeLines(response.lines);

    await this.persist();

    switch (response.systemAction) {
      case "save":
        this.ui.write("OK");
        break;
      case "disconnect":
        await this.dropCarrier("REMOTE SESSION SUSPENDED");
        return;
      case "restart":
        this.ui.clear();
        this.ui.write("SYSTEM 13 CLIENT RESTART");
        this.ui.write("LOCAL SESSION IMAGE RECOVERED");
        this.ui.write("");
        break;
      case "new-confirm":
        this.ui.write("");
        this.ui.write("Start a new war-dial scan?");
        this.ui.write("The current target will remain saved in the local phonebook.");
        this.ui.write(`Type NEW ${this.engine.world.runId} to continue.`);
        this.mode = "new-confirm";
        this.ui.setPrompt("confirm> ");
        return;
    }

    this.syncPrompt();
  }

  private async handleLocalCommand(value: string): Promise<void> {
    this.ui.echo(LOCAL_PROMPT, value, false);
    const result = executeLocalCommand(value, this.local);
    if (result.clear) this.ui.clear();
    this.ui.writeLines(result.lines);

    if (!result.action) {
      this.ui.setPrompt(LOCAL_PROMPT);
      return;
    }

    switch (result.action.type) {
      case "scan":
        await this.scanNewTarget();
        return;
      case "redial":
        if (this.local.lastNumber) await this.dialTarget(this.local.lastNumber);
        else this.ui.setPrompt(LOCAL_PROMPT);
        return;
      case "dial":
        await this.dialTarget(result.action.number);
        return;
    }
  }

  private async scanNewTarget(): Promise<void> {
    this.mode = "busy";
    this.ui.setPrompt("");
    const seed = randomSeed();
    const plan = await runWarDial(this.ui, this.sound, seed);

    for (const attempt of plan.attempts) recordDial(this.local, attempt.number, attempt.outcome);

    const index = await loadScenarioIndex();
    if (index.length === 0) throw new Error("no scenarios are installed");
    const alternatives = this.currentSave && index.length > 1
      ? index.filter((entry) => entry.id !== this.currentSave?.scenarioId)
      : index;
    const selected = rngStream(seed, "scenario-select").pick(alternatives.length > 0 ? alternatives : index);
    const scenario = await loadScenario(selected.id);
    const world = generateWorld(scenario, seed);
    this.engine = new GameEngine(world);
    this.currentSave = makeSave(this.engine);
    this.currentNumber = plan.successfulNumber;

    registerTarget(this.local, plan.successfulNumber, world.runId, world.scenarioId);
    recordDial(this.local, plan.successfulNumber, "CONNECTED", world.runId);
    saveLocalClientState(this.local);
    await this.saves.save(this.currentSave);

    this.ui.writeLines(world.banner);
    this.ui.write("");
    this.mode = "engine";
    this.syncPrompt();
  }

  private async dialTarget(number: string): Promise<void> {
    this.mode = "busy";
    this.ui.setPrompt("");
    this.ui.clear();
    const target = this.local.targets[number];

    if (!target) {
      const outcome = await dialUnknownTarget(this.ui, this.sound, number);
      recordDial(this.local, number, outcome);
      saveLocalClientState(this.local);
      await this.ui.pause(400);
      this.showLocalShell("NO REMOTE SESSION ESTABLISHED");
      return;
    }

    let save = await this.saves.loadRun(target.runId);
    if (!save && this.currentSave && runIdFromSeed(this.currentSave.seed) === target.runId) save = this.currentSave;

    if (!save) {
      this.ui.write(`SESSION IMAGE MISSING FOR ${number}`);
      recordDial(this.local, number, "NO CARRIER");
      saveLocalClientState(this.local);
      await this.ui.pause(350);
      this.showLocalShell("TARGET REMOVED FROM ACTIVE SESSION CACHE");
      return;
    }

    assertCompatibleSave(save);
    await dialKnownTarget(this.ui, this.sound, number);
    const scenario = await loadScenario(save.scenarioId);
    if (scenario.version !== save.scenarioVersion) {
      this.ui.write(`SAVE REQUIRES SCENARIO ${save.scenarioVersion}; INSTALLED ${scenario.version}`);
      await this.ui.pause(350);
      this.showLocalShell("REMOTE SESSION VERSION MISMATCH");
      return;
    }

    const world = generateWorld(scenario, save.seed);
    this.engine = new GameEngine(world, save.state);
    this.currentSave = save;
    this.currentNumber = number;
    target.lastConnectedAt = new Date().toISOString();
    this.local.lastNumber = number;
    recordDial(this.local, number, "CONNECTED", target.runId);
    saveLocalClientState(this.local);
    await this.saves.setCurrent(save);

    if (this.engine.state.mode.kind === "login-user") {
      this.ui.writeLines(world.banner);
      this.ui.write("");
    } else {
      this.ui.write("REMOTE SESSION IMAGE RECOVERED");
      this.ui.write(`RUN ID ............ ${world.runId}`);
      this.ui.write(`HOST .............. ${this.engine.host.hostname}`);
      this.ui.write(`USER .............. ${this.engine.user?.username ?? "(login)"}`);
      this.ui.write("");
    }

    this.mode = "engine";
    this.syncPrompt();
  }

  private async dropCarrier(note: string): Promise<void> {
    this.ui.write("");
    this.ui.write("+++ATH0");
    await this.ui.pause(150);
    this.ui.write("NO CARRIER");
    await this.ui.pause(350);
    this.showLocalShell(note);
  }

  private showLocalShell(note?: string): void {
    this.mode = "local-shell";
    this.ui.clear();
    this.ui.writeLines(localWelcome(this.local));
    if (this.currentSave) {
      this.ui.write(`CURRENT RUN ......... ${runIdFromSeed(this.currentSave.seed)}`);
      this.ui.write(`CURRENT TARGET ...... ${this.currentNumber ?? "UNKNOWN"}`);
      this.ui.write("");
    }
    if (note) {
      this.ui.write(note);
      this.ui.write("");
    }
    this.ui.setPrompt(LOCAL_PROMPT);
  }

  private async persist(): Promise<void> {
    if (!this.engine) return;
    const createdAt = this.currentSave?.createdAt;
    this.currentSave = makeSave(this.engine, createdAt);
    await this.saves.save(this.currentSave);
  }

  private syncPrompt(): void {
    if (!this.engine) return;
    this.ui.setPrompt(this.engine.prompt(), this.engine.maskedInput);
  }
}
