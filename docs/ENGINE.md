# SYSTEM 13 Game Engine Design

**Status:** Draft architecture for the first playable engine.

This document defines the initial engine model for SYSTEM 13 before implementation begins. The goal is to make the game convincing, deterministic, easy to extend, easy to save, and impossible for the fake shell to become a real host shell.

## Design Principles

1. **The browser is the game machine.** The initial engine runs entirely in the browser.
2. **The fake shell is an interpreter, never a subprocess wrapper.** No player command is sent to a host shell.
3. **Story content is data.** Scenario packs describe companies, hosts, users, files, clues, events, puzzles, and endings without arbitrary executable code.
4. **Runs are deterministic.** A run seed plus compatible content versions should recreate the same generated world.
5. **Mutable state stays small.** Saves store what changed, not a duplicate of the entire generated world.
6. **Presentation is separate from simulation.** CRT effects, typing delays, modem sounds, animation, and UI should not contain game rules.
7. **Commands operate on game objects only.** Files, processes, users, services, network hosts, and permissions are simulated data structures.
8. **Content must be testable.** Scenario validation should eventually catch unreachable clues, broken references, impossible escalation paths, and missing endings.

---

## Engine Layers

SYSTEM 13 should model each run using four distinct layers.

```text
ScenarioDefinition
      |
      | + run seed
      v
GeneratedWorld
      |
      | + player actions
      v
RunState
      |
      | rendered through
      v
Session / Presentation State
```

### 1. ScenarioDefinition

Static authored content loaded from a scenario pack.

Examples:

- company identity
- available facilities
- host templates
- employee/name pools
- account templates
- file templates
- mail/messages
- clue pools
- fictional vulnerabilities
- event definitions
- ending definitions
- reward definitions
- randomization rules

A scenario definition must not contain arbitrary JavaScript or shell commands.

### 2. GeneratedWorld

The immutable world generated from a scenario definition and a deterministic run seed.

Examples:

- selected company/project variant
- chosen employee names
- generated passwords
- selected host topology
- file placement
- selected incident details
- selected clue chain
- selected ending/reward pool

For a compatible engine/scenario version:

```text
scenario + seed -> same GeneratedWorld
```

The generated world should normally not be serialized into the save file because it can be recreated.

### 3. RunState

The mutable state created by player activity.

Examples:

- current host
- current user
- current working directory per host/session
- known credentials
- discovered hosts
- discovered files
- read/unread messages
- changed passwords
- modified virtual files
- service states
- process states
- doors/cameras/facility controls
- story flags
- fired one-shot events
- unlocked commands/features
- achievements
- ending state
- statistics

### 4. SessionState

Temporary UI/session data that generally does not affect the game world.

Examples:

- current terminal input buffer
- command history cursor
- terminal scrollback
- active typing animation
- CRT settings
- audio settings
- modal/overlay state
- interrupted animation state

Some user preferences may be persisted separately from a game save.

---

## Proposed Source Layout

The initial client engine can live under:

```text
client/src/
├── app/
│   └── application orchestration
├── engine/
│   ├── core/
│   │   ├── types.ts
│   │   ├── engine.ts
│   │   ├── state.ts
│   │   └── effects.ts
│   ├── rng/
│   │   └── deterministic random generator
│   ├── command/
│   │   ├── tokenizer.ts
│   │   ├── parser.ts
│   │   ├── registry.ts
│   │   └── builtins/
│   ├── vfs/
│   │   ├── filesystem.ts
│   │   ├── paths.ts
│   │   └── permissions.ts
│   ├── auth/
│   │   ├── users.ts
│   │   └── credentials.ts
│   ├── network/
│   │   ├── hosts.ts
│   │   └── services.ts
│   ├── events/
│   │   ├── conditions.ts
│   │   ├── actions.ts
│   │   └── dispatcher.ts
│   ├── scenario/
│   │   ├── loader.ts
│   │   ├── generator.ts
│   │   ├── schema.ts
│   │   └── validator.ts
│   └── save/
│       ├── store.ts
│       ├── schema.ts
│       └── migrate.ts
├── terminal/
│   ├── renderer.ts
│   ├── input.ts
│   └── history.ts
├── presentation/
│   ├── crt.ts
│   ├── audio.ts
│   ├── modem.ts
│   └── animation.ts
└── main.ts
```

This is a responsibility map, not a requirement that every file exist immediately.

---

## Core Engine Contract

The engine should expose a small API to the application layer.

Conceptually:

```ts
interface GameEngine {
  getSnapshot(): EngineSnapshot;
  submit(input: string): EngineResult;
  dispatch(action: EngineAction): EngineResult;
  serialize(): SaveGame;
}
```

The terminal should not mutate world state directly.

The normal flow should be:

```text
keyboard
   |
   v
terminal input
   |
   v
engine.submit(text)
   |
   v
parse command
   |
   v
command handler
   |
   +--> read GeneratedWorld
   +--> read/update RunState
   +--> enqueue events
   +--> emit presentation effects
   |
   v
EngineResult
   |
   +--> terminal output
   +--> sound/animation effects
   +--> autosave request
```

A useful result shape is likely:

```ts
interface EngineResult {
  output: OutputChunk[];
  effects: EngineEffect[];
  stateChanged: boolean;
}
```

Presentation effects might include things such as:

- delayed text
- clear screen
- modem noise
- beep
- glitch
- disconnect
- reconnect
- ASCII animation
- prompt change

The simulation can request these effects without knowing how CSS/audio actually renders them.

---

## Command System

The command system should feel Unix-like without attempting to implement Bash.

### Pipeline

```text
raw text
  -> tokenize
  -> parse
  -> normalize
  -> command lookup
  -> permission/context checks
  -> command handler
  -> state changes
  -> event evaluation
  -> output/effects
```

### Initial Parser Scope

Version 1 should understand:

- command name
- positional arguments
- short flags such as `-l` and `-a`
- combined short flags such as `-la`
- long flags such as `--debug`
- quoted strings
- absolute and relative virtual paths
- `~`, `.`, and `..`

Do **not** begin by implementing full shell grammar.

The parser should reserve room for later support of:

- pipes
- output redirection
- simple environment expansion
- command chaining

but these should not be required for the first playable scenario.

### Command Registry

Commands should be registered by engine code rather than implemented by scenario packs.

Examples:

```text
help
clear
pwd
cd
ls
cat
less
head
tail
grep
find
whoami
id
history
env
ps
kill
uname
hostname
passwd
su
sudo
ssh
netstat
mount
service
mail
```

Scenario data may:

- enable/disable a command on a host
- change command help text/version strings
- expose fictional flags/options
- configure command-visible data

Scenario data must not provide executable command handlers.

### Fictional Utilities

Scenario-specific utilities such as:

```text
syscheck
logview
diag
archive
netprobe
hexview
```

should use a generic engine-supported utility model where possible. The scenario defines menus, inputs, permissions, outputs, conditions, and effects; the engine executes a known declarative utility type.

If a genuinely new mechanic is needed, it is added to the engine deliberately rather than smuggling script execution into scenario content.

---

## Virtual Filesystem

Each fake host gets its own filesystem root.

The VFS should model familiar Unix concepts while remaining lightweight.

### Node Types

Initial node types:

```text
directory
file
symlink
```

Possible future types:

```text
device
socket
fifo
virtual/proc entry
```

### VFS Identity

Internally, nodes should have stable IDs rather than relying only on paths.

Example:

```ts
interface VfsNode {
  id: string;
  type: "file" | "directory" | "symlink";
  name: string;
  owner: string;
  group: string;
  mode: number;
}
```

Stable IDs allow story/event references to survive renames or generated paths.

### Permissions

Use recognizable POSIX-like semantics:

- owner
- group
- numeric mode bits
- root user with UID 0 semantics

We do not need every obscure Unix permission feature initially.

The first implementation should support enough for familiar interactions:

```text
-rw-r-----
drwx------
drwxr-xr-x
```

Permission checks should happen inside the VFS API so command handlers cannot accidentally bypass them.

### Mutable Overlay

Generated filesystems remain immutable definitions.

Changes are stored as an overlay in `RunState`, such as:

- file content replacement
- created/deleted nodes
- changed owner/group/mode
- moved/renamed nodes

This keeps saves small.

### File Content

File content should support:

1. inline text
2. external text assets
3. deterministic templates

Example template substitutions might include engine-provided values such as generated employee names, hostnames, dates, project names, or IDs.

Template evaluation must be a restricted substitution system, not arbitrary code execution.

---

## Users, Groups, Authentication, and Privilege

Users are game entities attached to hosts.

A user model should include approximately:

```ts
interface UserDefinition {
  id: string;
  username: string;
  uid: number;
  primaryGroup: string;
  groups: string[];
  home: string;
  shell: string;
  displayName?: string;
  enabled: boolean;
}
```

Credentials should be separate game objects so scenarios can create clue chains without storing plaintext passwords inside every account definition.

Credential types may include:

- password
- key
- token
- recovery code
- service credential
- fictional hardware/access credential

The engine may store/generated plaintext values because these are fictional game secrets, not real authentication material.

### Login and Session Identity

A session identity should track:

```text
host
user
uid
groups
cwd
environment
privilege/source
```

`su`, `sudo`, remote login, and special fictional escalation mechanics all change session identity through engine-defined rules.

### Root

Root should be a real engine-level privilege concept, not merely a story flag.

UID 0 can bypass ordinary VFS permission checks and perform privileged engine operations where allowed by the fake host configuration.

A scenario may still contain systems or story constructs that remain inaccessible to ordinary root for narrative reasons, but those should be explicit game mechanics rather than secretly breaking permission semantics.

---

## Fake Processes and Services

Processes should be lightweight game objects, not simulated CPU execution.

Example:

```ts
interface ProcessState {
  pid: number;
  hostId: string;
  ownerUserId: string;
  name: string;
  status: "running" | "sleeping" | "stopped";
  protected?: boolean;
  tags?: string[];
}
```

Processes exist so commands such as `ps`, `kill`, diagnostics, and story events have convincing state to operate on.

Services are higher-level objects that may own processes and expose network endpoints or scenario behavior.

Examples:

```text
mail
archive
security
observer
backup
telemetry
camera-control
```

Starting/stopping a service may trigger events, reveal hosts, alter files, open/close access paths, or change endings.

---

## Fake Network Model

The network is a graph of hosts and services.

### Host

A host should have:

```text
stable ID
hostname
aliases
fictional address
OS/banner identity
filesystem
users/groups
services
process table
local configuration
network links
```

The address does not need to correspond to a real routable network and should remain clearly fictional/generated.

### Discovery vs Reachability

The engine should distinguish:

- host exists
- player has discovered host
- current host can route/reach target
- required service is available
- authentication succeeds

That allows clues from `netstat`, logs, mail, files, and diagnostics to reveal machines gradually.

### Connections

Commands such as `ssh` change the active session to another fake host.

We should maintain a connection/session stack so `exit` can naturally return the player to the prior host:

```text
LOCAL DIAL SESSION
   -> admin13
      -> archive03
         -> research-gateway
```

This gives the illusion of moving through a network without needing actual sockets between fake machines.

---

## Events, Flags, Conditions, and Actions

This is the core story system.

Scenario behavior should be represented declaratively as:

```text
WHEN conditions are true
THEN perform actions
```

### Conditions

Initial generic conditions may include:

- flag set/unset
- current host is X
- current user is X
- user has root
- file has been read
- credential known
- host discovered
- host rooted
- command executed
- service running/stopped
- process exists/does not exist
- event already fired/not fired
- counter threshold reached
- ending not reached

Conditions should support simple all/any/not composition.

### Actions

Initial generic actions may include:

- set/clear flag
- reveal host
- reveal credential
- unlock command/feature
- add/replace/remove virtual file
- start/stop service
- spawn/remove fake process
- send mail/message
- emit terminal text
- emit presentation effect
- change facility state
- increment counter
- queue another event
- grant achievement
- unlock ending
- finish run

### Event Timing

Events can be evaluated after engine actions and at explicit lifecycle points such as:

```text
run created
host connected
login success
command completed
file read
credential learned
privilege changed
service changed
host rooted
ending selected
```

### One-shot Events

Every event should explicitly declare whether it is:

```text
once
repeatable
cooldown/limited (future)
```

One-shot event IDs are recorded in the save state.

---

## Puzzle Model

A puzzle does not need a special hard-coded minigame type for every clue chain.

Most puzzles should emerge from normal engine state:

```text
read note
 -> learn account name
 -> inspect backup config
 -> learn credential location
 -> read key
 -> authenticate as maintenance
 -> access new directory
 -> discover host
 -> connect to host
```

The event system can track completion and provide achievements/endings without forcing every step into a monolithic "puzzle" object.

A higher-level puzzle definition can still exist for:

- validation
- hints
- progress statistics
- alternate solution paths

but the normal mechanics should remain composable engine actions.

---

## Deterministic Random Generation

SYSTEM 13 should use one explicit seeded PRNG implementation rather than `Math.random()` for generated game content.

The generator should support named deterministic streams derived from the master seed.

Conceptually:

```text
master seed
├── company
├── incident
├── employees
├── credentials
├── topology
├── clue-placement
├── anomalies
└── rewards
```

This prevents unrelated content changes from scrambling every other randomized choice.

For example, adding one more employee to a department should not necessarily change the selected ending.

### Run ID

A player-facing Run ID can encode or derive from the seed, for example:

```text
7F42-1AC9
```

The exact format can be chosen later.

### Compatibility

Save metadata should pin enough information to reproduce the world:

```text
engine generation version
scenario ID
scenario version
scenario schema version
seed
```

If generation algorithms change incompatibly, old saves can either use a compatibility generator or be migrated intentionally.

---

## Save System

Use IndexedDB for game saves.

`localStorage` may contain only lightweight preferences or a marker that a save exists.

### Save Shape

Conceptually:

```ts
interface SaveGame {
  saveVersion: number;
  engineVersion: string;
  generationVersion: number;
  scenarioId: string;
  scenarioVersion: string;
  seed: string;
  createdAt: string;
  updatedAt: string;
  runState: RunState;
}
```

### Autosave

Autosave after meaningful state-changing operations such as:

- login success
- privilege change
- credential discovery
- host discovery
- file/state mutation
- story flag change
- service change
- achievement
- ending change

The player-facing `system save` command may exist for reassurance, but progress should not depend on it.

### Migrations

Every save format has an integer `saveVersion`.

Loading should follow:

```text
read save
 -> validate
 -> migrate sequentially if needed
 -> validate migrated result
 -> generate world
 -> apply RunState overlay
 -> resume
```

Never silently discard an incompatible save.

---

## Scenario Pack Draft Layout

A first scenario pack could use a layout similar to:

```text
scenarios/
└── american-meridian/
    ├── manifest.yaml
    ├── generation.yaml
    ├── pools/
    │   ├── employees.yaml
    │   ├── projects.yaml
    │   └── incidents.yaml
    ├── hosts/
    │   ├── node13.yaml
    │   ├── archive03.yaml
    │   └── research-gateway.yaml
    ├── events/
    │   ├── discovery.yaml
    │   └── endings.yaml
    ├── content/
    │   ├── mail/
    │   ├── notes/
    │   └── reports/
    └── tests/
        └── expected-paths.yaml
```

This is a draft and should be validated against the first implementation before becoming a stable authoring contract.

### Manifest

A manifest will likely declare:

```yaml
schema: 1
id: american-meridian
version: 0.1.0
name: American Meridian
minimumEngineVersion: 0.1.0
entryHost: node13
```

### Content IDs

Every scenario object referenced by another object should use a stable namespaced ID.

Examples:

```text
host.node13
user.node13.guest
credential.maintenance
file.node13.backup-config
event.project-reveal
ending.containment-opened
```

Human-readable names can change without breaking references.

---

## System-Level Commands

SYSTEM 13 client controls should live in a namespace that cannot be confused with the fake host shell.

Initial plan:

```text
system status
system save
system disconnect
system restart
system new
system settings
system help
```

These commands are handled by the application/client layer, not the current fake host.

This separation lets a scenario safely contain a fake executable named `system` if we ever want it, because the parser can reserve the client-control namespace before host command dispatch.

---

## Modem / Dial Layer

The modem is a presentation and connection layer sitting above the fake host session.

It should support engine/application events such as:

```text
scan started
dial attempt
busy
no answer
no carrier
carrier detected
connected
disconnected
redial
manual dial
```

The initial war-dial sequence can be procedurally generated from the run seed while still guaranteeing eventual connection to the scenario entry host.

Incidental dial results can be flavor encounters that do not create full hosts.

Later, manually dialable numbers discovered in scenario content can map to actual hosts or hidden encounters.

---

## Validation Strategy

Validation should happen at multiple levels.

### Schema Validation

Check types, required keys, versions, and allowed values.

### Reference Validation

Check that referenced IDs exist.

### Structural Validation

Examples:

- filesystem paths are valid
- user home directories exist
- referenced users exist on target hosts
- services reference valid hosts/process definitions
- entry host exists
- endings are defined

### Reachability Validation

Eventually build a lightweight graph analysis for critical progression.

A scenario author should be able to mark certain facts/capabilities as required milestones:

```text
gain initial user
learn maintenance credential
reach archive host
gain admin
reach root
unlock at least one ending
```

The validator can then detect obviously impossible content before deployment.

### Scenario Tests

Scenario packs should support authored test paths consisting of engine actions and expected state.

Example concept:

```yaml
- command: "login guest"
  expect:
    user: guest

- command: "cat .notes"
  expectFlag: clue.backup-account
```

The exact syntax will be defined after the engine API exists.

---

## Error Philosophy

The game should distinguish internal engine failures from believable in-world failures.

Player mistakes:

```text
permission denied
command not found
no such file or directory
connection refused
authentication failed
```

Engine/content bugs should not masquerade as game responses during development.

Development mode should surface clear diagnostics such as:

```text
[S13 ENGINE ERROR]
Missing object: credential.maintenance
Triggered by event: event.backup-leak
```

Production may show a controlled terminal fault while still logging enough information to diagnose the problem.

---

## Initial Implementation Slice

The first engine milestone should remain intentionally small.

### Milestone E0 — Core Loop

Implement:

1. deterministic RNG
2. base engine state/types
3. command tokenizer/parser
4. command registry
5. one in-memory fake host
6. users/groups
7. virtual filesystem + permissions
8. commands:
   - `help`
   - `clear`
   - `pwd`
   - `cd`
   - `ls`
   - `cat`
   - `whoami`
   - `id`
   - `uname`
   - `hostname`
9. terminal prompt/input/history
10. simple login state

No procedural conspiracy generation is required yet.

Success criterion:

```text
login: guest
password: ********

guest@node13:~$ ls -la
guest@node13:~$ cat README
guest@node13:~$ whoami
guest
guest@node13:~$
```

### Milestone E1 — Progression

Add:

- credentials
- `su`
- basic `sudo`
- processes/services
- `ps`
- fake host discovery
- fake network graph
- `ssh`
- event conditions/actions
- flags
- first privilege-escalation chain

### Milestone E2 — Scenario Data

Move the hard-coded E0/E1 test world into the first external scenario pack.

Add:

- scenario loader
- schema
- validator
- deterministic generator
- external text assets

### Milestone E3 — Persistence

Add:

- IndexedDB saves
- autosave
- resume
- migrations
- `system` client commands
- run IDs

### Milestone E4 — Atmosphere

Add:

- modem state machine
- war-dial intro
- audio effects
- CRT effects
- typed output/effect sequencing
- fake disconnect/reconnect

At that point SYSTEM 13 has a complete vertical slice and scenario authoring can expand rapidly.

---

## Decisions Intentionally Deferred

Do not lock these down until E0/E1 tells us what the engine actually needs:

- full scenario JSON/YAML schema
- pipes and redirection syntax
- virtual device files
- advanced Unix ACLs
- server-side saves/accounts
- multiplayer/shared worlds
- scripting/plugin API
- real-time clocks inside scenarios
- complex minigames
- downloadable third-party scenario packs

The design should leave room for them without paying their complexity cost now.
