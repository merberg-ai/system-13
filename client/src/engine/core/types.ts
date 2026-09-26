export type NodeType = "file" | "dir";

export interface VirtualNode {
  path: string;
  type: NodeType;
  owner: string;
  group: string;
  mode: number;
  content?: string;
}

export interface GameUser {
  id: string;
  username: string;
  uid: number;
  gid: number;
  groups: string[];
  home: string;
  shell: string;
  password: string;
}

export interface GameProcess {
  pid: number;
  user: string;
  command: string;
  cpu?: number;
  memory?: number;
}

export interface GameService {
  name: string;
  state: "running" | "stopped" | "failed";
  description?: string;
}

export interface GameHost {
  id: string;
  hostname: string;
  aliases: string[];
  os: string;
  kernel: string;
  architecture: string;
  groups: Record<string, number>;
  users: Record<string, GameUser>;
  files: Record<string, VirtualNode>;
  processes: GameProcess[];
  services: GameService[];
  neighbors: string[];
  commands: string[];
}

export type EventCondition =
  | { type: "fileRead"; hostId: string; path: string }
  | { type: "flag"; flag: string }
  | { type: "hostDiscovered"; hostId: string }
  | { type: "currentUser"; hostId?: string; username: string }
  | { type: "rootOn"; hostId: string }
  | { type: "commandExecuted"; hostId?: string; command: string };

export type EventAction =
  | { type: "setFlag"; flag: string }
  | { type: "discoverHost"; hostId: string }
  | { type: "learnCredential"; credentialId: string }
  | { type: "output"; lines: string[] }
  | { type: "achievement"; id: string }
  | { type: "ending"; id: string; title: string }
  | { type: "spawnProcess"; hostId: string; process: GameProcess };

export interface EventRule {
  id: string;
  once?: boolean;
  all: EventCondition[];
  actions: EventAction[];
}

export interface GeneratedWorld {
  schemaVersion: 1;
  scenarioId: string;
  scenarioVersion: string;
  title: string;
  company: { name: string; slogan: string };
  seed: string;
  runId: string;
  startHostId: string;
  banner: string[];
  generation: Record<string, unknown>;
  hosts: Record<string, GameHost>;
  events: EventRule[];
}

export interface SessionFrame { hostId: string; username: string | null; cwd: string; }

export type EngineMode =
  | { kind: "login-user" }
  | { kind: "login-password"; username: string }
  | { kind: "shell" }
  | { kind: "su-password"; username: string }
  | { kind: "ssh-password"; hostId: string; username: string };

export interface DynamicProcessMap { [hostId: string]: GameProcess[]; }

export interface RunState {
  stateVersion: 1;
  sessionStack: SessionFrame[];
  mode: EngineMode;
  history: string[];
  flags: string[];
  discoveredHosts: string[];
  knownCredentials: string[];
  readFiles: string[];
  firedEvents: string[];
  achievements: string[];
  rootedHosts: string[];
  dynamicProcesses: DynamicProcessMap;
  commandLog: string[];
  commandCount: number;
  ending?: { id: string; title: string };
}

export type SystemAction = "save" | "disconnect" | "restart" | "new-confirm";
export interface EngineResponse { lines: string[]; clear?: boolean; systemAction?: SystemAction; }
export interface CommandInvocation { raw: string; name: string; args: string[]; }

export interface ScenarioVariableChoice { kind: "choice"; values: unknown[]; }
export interface ScenarioVariablePassword { kind: "password"; words: string[]; digits?: number; }
export interface ScenarioVariableNumber { kind: "number"; min: number; max: number; }
export type ScenarioVariable = ScenarioVariableChoice | ScenarioVariablePassword | ScenarioVariableNumber;

export interface ScenarioUserTemplate {
  id: string; username: string; uid: number; gid: number; groups: string[]; home: string; shell: string; password: string;
}
export interface ScenarioFileTemplate extends VirtualNode {}
export interface ScenarioHostTemplate {
  id: string; hostname: string; aliases?: string[]; os: string; kernel: string; architecture?: string;
  groups: Record<string, number>; users: ScenarioUserTemplate[]; files: ScenarioFileTemplate[];
  processes?: GameProcess[]; services?: GameService[]; neighbors?: string[]; commands?: string[];
}
export interface ScenarioDefinition {
  schemaVersion: 1; id: string; version: string; title: string;
  company: { name: string; slogan: string };
  startHostId: string; banner: string[];
  generation: { variables: Record<string, ScenarioVariable> };
  hosts: ScenarioHostTemplate[]; events?: EventRule[];
}
export interface RunSave {
  saveVersion: 1; engineVersion: string; scenarioId: string; scenarioVersion: string; seed: string;
  createdAt: string; updatedAt: string; state: RunState;
}
