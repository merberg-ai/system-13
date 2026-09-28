export type DialOutcome = "CONNECTED" | "BUSY" | "NO ANSWER" | "NO CARRIER";

export interface DialRecord {
  number: string;
  outcome: DialOutcome;
  at: string;
  runId?: string;
}

export interface LocalTarget {
  number: string;
  runId: string;
  scenarioId: string;
  lastConnectedAt: string;
}

export interface LocalClientState {
  version: 1;
  lastNumber?: string;
  targets: Record<string, LocalTarget>;
  history: DialRecord[];
}

export type LocalAction =
  | { type: "scan" }
  | { type: "redial" }
  | { type: "dial"; number: string };

export interface LocalCommandResult {
  lines: string[];
  clear?: boolean;
  action?: LocalAction;
}

const STORAGE_KEY = "system13.local-client.v1";

export function emptyLocalClientState(): LocalClientState {
  return { version: 1, targets: {}, history: [] };
}

export function loadLocalClientState(): LocalClientState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLocalClientState();
    const parsed = JSON.parse(raw) as Partial<LocalClientState>;
    if (parsed.version !== 1) return emptyLocalClientState();
    return {
      version: 1,
      lastNumber: parsed.lastNumber,
      targets: parsed.targets ?? {},
      history: Array.isArray(parsed.history) ? parsed.history.slice(-100) : []
    };
  } catch {
    return emptyLocalClientState();
  }
}

export function saveLocalClientState(state: LocalClientState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, history: state.history.slice(-100) }));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

export function normalizePhoneNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 7) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export function registerTarget(
  state: LocalClientState,
  number: string,
  runId: string,
  scenarioId: string
): void {
  const now = new Date().toISOString();
  state.targets[number] = { number, runId, scenarioId, lastConnectedAt: now };
  state.lastNumber = number;
}

export function recordDial(
  state: LocalClientState,
  number: string,
  outcome: DialOutcome,
  runId?: string
): void {
  state.history.push({ number, outcome, at: new Date().toISOString(), runId });
  if (state.history.length > 100) state.history.splice(0, state.history.length - 100);
  if (outcome === "CONNECTED") state.lastNumber = number;
}

export function localBanner(): string[] {
  return [
    "  ____  __   __ ____  _____ _____ __  __    _ _____",
    " / ___| \\ \\ / // ___||_   _| ____|  \\/  |  / |___ /",
    " \\___ \\  \\ V / \\___ \\  | | |  _| | |\\/| |  | | |_ \\",
    "  ___) |  | |   ___) | | | | |___| |  | |  | |___) |",
    " |____/   |_|  |____/  |_| |_____|_|  |_|  |_|____/",
    "",
    "        REMOTE ACCESS / WAR-DIAL CLIENT",
    "        LOCAL CONTROL SHELL  v0.3",
    ""
  ];
}

export function localWelcome(state: LocalClientState): string[] {
  const lines = localBanner();
  lines.push("MODEM .............. READY");
  lines.push(`KNOWN TARGETS ...... ${Object.keys(state.targets).length}`);
  lines.push(`LAST CARRIER ....... ${state.lastNumber ?? "NONE"}`);
  lines.push("");
  lines.push("Type 'help' for local commands.");
  lines.push("");
  return lines;
}

function targetLines(state: LocalClientState): string[] {
  const targets = Object.values(state.targets).sort((a, b) => b.lastConnectedAt.localeCompare(a.lastConnectedAt));
  if (targets.length === 0) return ["No saved carrier targets.", "Use 'scan' to search a dial range."];
  return [
    "NUMBER       RUN ID       SCENARIO",
    ...targets.map((target) => `${target.number.padEnd(12)} ${target.runId.padEnd(12)} ${target.scenarioId}`)
  ];
}

function historyLines(state: LocalClientState): string[] {
  if (state.history.length === 0) return ["Dial history is empty."];
  return [
    "TIME                 NUMBER       RESULT",
    ...state.history.slice(-20).map((entry) => {
      const when = new Date(entry.at).toLocaleString();
      return `${when.padEnd(20)} ${entry.number.padEnd(12)} ${entry.outcome}`;
    })
  ];
}

export function executeLocalCommand(input: string, state: LocalClientState): LocalCommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };
  const [rawCommand, ...args] = trimmed.split(/\s+/);
  const command = rawCommand.toLowerCase();

  switch (command) {
    case "help":
    case "?":
      return {
        lines: [
          "SYSTEM 13 LOCAL COMMANDS",
          "  scan                 war-dial for a new carrier",
          "  dial <number>        dial a specific seven-digit number",
          "  redial               reconnect the last carrier",
          "  targets              list saved carrier targets",
          "  history              show recent dial attempts",
          "  status               local client status",
          "  clear                clear the terminal",
          "",
          "Local shell aliases:",
          "  ls  cat README  pwd  whoami  hostname"
        ]
      };
    case "scan":
      return { lines: ["Starting automatic scan...", ""], action: { type: "scan" } };
    case "redial":
      if (!state.lastNumber) return { lines: ["redial: no previous carrier"] };
      return { lines: [], action: { type: "redial" } };
    case "dial": {
      if (!args[0]) return { lines: ["usage: dial NNN-NNNN"] };
      const number = normalizePhoneNumber(args[0]);
      if (!number) return { lines: ["dial: expected a seven-digit number"] };
      return { lines: [], action: { type: "dial", number } };
    }
    case "targets":
    case "sessions":
      return { lines: targetLines(state) };
    case "history":
      return { lines: historyLines(state) };
    case "status":
      return {
        lines: [
          "SYSTEM 13 LOCAL CLIENT",
          "MODEM .............. READY",
          `KNOWN TARGETS ...... ${Object.keys(state.targets).length}`,
          `DIAL RECORDS ....... ${state.history.length}`,
          `LAST CARRIER ....... ${state.lastNumber ?? "NONE"}`
        ]
      };
    case "clear":
    case "cls":
      return { lines: [], clear: true };
    case "pwd":
      return { lines: ["/home/operator"] };
    case "whoami":
      return { lines: ["operator"] };
    case "hostname":
      return { lines: ["system13"] };
    case "ls":
      return { lines: ["README", "dialer", "sessions"] };
    case "cat":
      if ((args[0] ?? "").toLowerCase() !== "readme") return { lines: [`cat: ${args[0] ?? ""}: No such file`] };
      return {
        lines: [
          "SYSTEM 13 Remote Access Client",
          "",
          "This local shell controls the simulated modem and saved remote sessions.",
          "Use 'scan' to discover a carrier or 'targets' to revisit one already found.",
          "Remote systems have their own commands, users, filesystems and history."
        ]
      };
    default:
      return { lines: [`${command}: local command not found`, "Type 'help' for available commands."] };
  }
}
