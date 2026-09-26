import { GameEngine } from "../engine/core/engine.js";
import type { RunSave } from "../engine/core/types.js";
import { randomSeed, runIdFromSeed } from "../engine/rng/rng.js";
import { generateWorld } from "../engine/scenario/generator.js";
import { loadScenario } from "../engine/scenario/loader.js";
import { assertCompatibleSave, makeSave } from "../engine/save/save.js";
import { SaveStore } from "../engine/save/store.js";
import { runWarDial } from "../presentation/modem.js";
import { SoundEngine } from "../presentation/sound.js";
import { TerminalUI } from "../terminal/terminal.js";

const DEFAULT_SCENARIO = "american-meridian";

type AppMode = "boot-choice" | "ready-new" | "busy" | "engine" | "new-confirm" | "disconnected";

export class System13App {
  private readonly ui = new TerminalUI();
  private readonly sound = new SoundEngine();
  private readonly saves = new SaveStore();
  private engine: GameEngine | null = null;
  private currentSave: RunSave | null = null;
  private mode: AppMode = "ready-new";

  async start(): Promise<void> {
    await this.saves.init();
    this.ui.onSubmit((value) => this.handleSubmit(value));
    document.addEventListener("keydown", () => this.sound.activate(), { once: true });

    try {
      const save = await this.saves.load();
      if (save) {
        assertCompatibleSave(save);
        this.currentSave = save;
        this.mode = "boot-choice";
        this.ui.clear();
        this.ui.write("SYSTEM 13");
        this.ui.write("");
        this.ui.write("LOCAL SESSION IMAGE DETECTED");
        this.ui.write("");
        this.ui.write(`RUN ID ............ ${runIdFromSeed(save.seed)}`);
        this.ui.write(`SCENARIO .......... ${save.scenarioId}`);
        this.ui.write(`LAST SAVED ........ ${new Date(save.updatedAt).toLocaleString()}`);
        this.ui.write("");
        this.ui.write("[R] RESUME   [N] NEW CONNECTION");
        this.ui.setPrompt("selection> ");
        return;
      }
    } catch (error) {
      this.ui.write(`LOCAL SAVE ERROR: ${error instanceof Error ? error.message : String(error)}`);
      this.ui.write("Starting without recovered state.");
      this.ui.write("");
    }

    this.mode = "ready-new";
    this.ui.clear();
    this.ui.write("SYSTEM 13");
    this.ui.write("");
    this.ui.write("AUTO-DIALER READY");
    this.ui.write("");
    this.ui.write("Press ENTER to begin scanning.");
    this.ui.setPrompt("");
  }

  private async handleSubmit(value: string): Promise<void> {
    this.sound.activate();

    if (this.mode === "boot-choice") {
      this.ui.echo("selection> ", value, false);
      const choice = value.trim().toLowerCase();
      if (choice === "r" || choice === "resume") {
        await this.resume();
      } else if (choice === "n" || choice === "new") {
        await this.startNew();
      } else {
        this.ui.write("Select R or N.");
        this.ui.setPrompt("selection> ");
      }
      return;
    }

    if (this.mode === "ready-new") {
      await this.startNew();
      return;
    }

    if (this.mode === "new-confirm") {
      const expected = `DELETE ${this.engine?.world.runId ?? ""}`;
      this.ui.echo("confirm> ", value, false);
      if (value.trim() === expected) {
        await this.saves.clear();
        this.currentSave = null;
        await this.startNew();
      } else {
        this.ui.write("New connection cancelled.");
        this.mode = "engine";
        this.syncPrompt();
      }
      return;
    }

    if (this.mode === "busy") {
      return;
    }

    if (this.mode === "disconnected") {
      this.ui.clear();
      this.ui.write("REDIALING LAST CONNECTION...");
      await this.ui.pause(250);
      this.ui.write("CONNECT 1200");
      this.ui.write("");
      this.mode = "engine";
      this.syncPrompt();
      return;
    }

    if (!this.engine) return;
    const prompt = this.engine.prompt();
    const masked = this.engine.maskedInput;
    this.ui.echo(prompt, value, masked);
    const response = this.engine.handleInput(value);
    if (response.clear) this.ui.clear();
    this.ui.writeLines(response.lines);

    await this.persist();

    switch (response.systemAction) {
      case "save":
        this.ui.write("OK");
        break;
      case "disconnect":
        this.ui.write("Closing remote session...");
        this.ui.write("");
        this.ui.write("+++ATH0");
        this.ui.write("");
        this.ui.write("NO CARRIER");
        this.ui.write("");
        this.ui.write("Press ENTER to redial.");
        this.mode = "disconnected";
        this.ui.setPrompt("");
        return;
      case "restart":
        this.ui.clear();
        this.ui.write("SYSTEM 13 CLIENT RESTART");
        this.ui.write("LOCAL SESSION IMAGE RECOVERED");
        this.ui.write("");
        break;
      case "new-confirm":
        this.ui.write("");
        this.ui.write("WARNING: this will erase the current local run.");
        this.ui.write(`Type DELETE ${this.engine.world.runId} to continue.`);
        this.mode = "new-confirm";
        this.ui.setPrompt("confirm> ");
        return;
    }

    this.syncPrompt();
  }

  private async startNew(): Promise<void> {
    this.mode = "busy";
    this.ui.setPrompt("");
    const seed = randomSeed();
    await runWarDial(this.ui, this.sound, seed);
    const scenario = await loadScenario(DEFAULT_SCENARIO);
    const world = generateWorld(scenario, seed);
    this.engine = new GameEngine(world);
    this.currentSave = makeSave(this.engine);
    await this.saves.save(this.currentSave);
    this.ui.writeLines(world.banner);
    this.ui.write("");
    this.mode = "engine";
    this.syncPrompt();
  }

  private async resume(): Promise<void> {
    if (!this.currentSave) return this.startNew();
    this.mode = "busy";
    this.ui.setPrompt("");
    const scenario = await loadScenario(this.currentSave.scenarioId);
    if (scenario.version !== this.currentSave.scenarioVersion) {
      throw new Error(`save requires scenario ${this.currentSave.scenarioVersion}, installed ${scenario.version}`);
    }
    const world = generateWorld(scenario, this.currentSave.seed);
    this.engine = new GameEngine(world, this.currentSave.state);
    this.ui.clear();
    this.ui.write("SYSTEM 13");
    this.ui.write("");
    this.ui.write("LOCAL SESSION IMAGE RECOVERED");
    this.ui.write(`RUN ID: ${world.runId}`);
    this.ui.write("");
    this.ui.write("REDIALING...");
    await this.ui.pause(250);
    this.ui.write("CONNECT 1200");
    this.ui.write("");
    this.mode = "engine";
    this.syncPrompt();
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
