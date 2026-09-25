# SYSTEM 13

> A browser-based retro terminal hacking adventure with procedural mysteries, fake Linux systems, corporate conspiracies, and locally saved randomized scenarios.

**Status:** Pre-alpha / initial design and repository scaffolding.

SYSTEM 13 is a browser game built around the illusion of discovering and accessing forgotten computer systems through an old modem connection. The player begins by war-dialing a fictional phone range, eventually connects to an unknown system, gains limited user access, explores a simulated Unix/Linux-like environment, discovers fictional vulnerabilities and credentials, and works toward deeper privilege levels and ultimately root access.

The terminal is the game world.

## Core Experience

A typical run is intended to flow something like this:

```text
MODEM INITIALIZED
       |
       v
WAR DIAL
       |
       v
UNKNOWN SYSTEM ANSWERS
       |
       v
LOGIN PROMPT
       |
       v
LIMITED USER ACCESS
       |
       v
EXPLORE FILES / MAIL / LOGS / HOSTS
       |
       v
DISCOVER FICTIONAL EXPLOITS
       |
       v
GAIN PRIVILEGES
       |
       v
UNCOVER THE PROJECT
       |
       v
ROOT ACCESS
       |
       v
ENDING / REWARD / SOMETHING WORSE
```

The game takes inspiration from retro-futuristic terminals, old BBS and modem culture, command-line adventure games, corporate-conspiracy fiction, and postwar/Cold-War-era science-fiction aesthetics.

SYSTEM 13 is **not** intended to execute real shell commands or expose the host operating system. The player interacts with a simulated command interpreter, virtual filesystem, fake network, fictional services, and game-controlled state.

## Design Goals

- Browser-first and easy to host.
- Convincing old terminal / CRT presentation.
- Fictional Unix/Linux-style shell with enough familiar behavior to reward experimentation.
- Procedural runs generated from deterministic seeds.
- Multiple companies, incidents, projects, facilities, characters, clues, escalation paths, endings, and rewards.
- Scenario content kept separate from the core game engine.
- Easy scenario authoring and validation.
- Local browser save/resume for the initial releases.
- Safe by design: the in-game shell never becomes a real system shell.
- Simple production deployment behind an existing Nginx installation.
- Conservative deployment tooling that never rewrites unrelated web-server configuration.

## Scenario Concept

The initial version will begin with a single fictional company and a small scenario pool. Future scenario packs can add new companies, classified projects, incidents, employees, hosts, files, messages, puzzles, endings, and rare anomalies without changing the game engine.

Candidate story themes include:

- abandoned government research programs
- biological experiments
- behavioral research
- surveillance systems
- artificial intelligence
- strange energy or materials research
- robotics and human-machine interfaces
- unexplained facility incidents
- mundane corporate misconduct hiding something much stranger

Scenario data will be versioned and validated against a documented schema once the scenario engine is implemented.

## Planned Architecture

SYSTEM 13 is expected to be divided into independent components:

```text
Browser Client
├── terminal renderer
├── command interpreter
├── virtual filesystem
├── modem / war-dial sequence
├── fake networking
├── event and puzzle engine
├── audio / CRT presentation
└── local save manager

SYSTEM 13 Service
├── static game delivery
├── configuration
├── scenario discovery
├── health/version endpoints
└── optional future server-side features

Content
├── shared game data
└── scenario packs

Operations
├── install
├── build
├── deploy
├── update / rollback
├── backup / restore
└── system13ctl
```

Implementation details will be finalized during the framework milestone rather than locked in during repository initialization.

## Production Target

The initial production target is:

```text
https://system13.kj6ywd.net
```

The SYSTEM 13 service will bind only to localhost and sit behind the existing Nginx installation.

Deployment tooling will follow one hard rule:

> Existing web services are production infrastructure. SYSTEM 13 may create and manage its own dedicated virtual host, but it must not modify unrelated Nginx sites, certificates, or application configuration.

SSL setup will be designed around Certbot without allowing SYSTEM 13 deployment to overwrite the existing `kj6ywd.net` configuration.

## Planned Administration

A single administrative command, `system13ctl`, is planned for production management. Expected responsibilities include:

```text
system13ctl status
system13ctl start
system13ctl stop
system13ctl restart
system13ctl logs

system13ctl config show
system13ctl config edit
system13ctl config validate

system13ctl scenario list
system13ctl scenario info
system13ctl scenario validate

system13ctl maintenance on
system13ctl maintenance off

system13ctl update
system13ctl rollback
system13ctl backup
system13ctl restore

system13ctl nginx test
system13ctl ssl status
system13ctl ssl setup
```

These commands are design targets and are not implemented yet.

## Development Roadmap

### Phase 0 — Foundation

- [x] Initialize repository documentation.
- [x] Define core game concept and deployment safety rules.
- [ ] Select and scaffold the application framework.
- [ ] Add development/build tooling.
- [ ] Add a minimal SYSTEM 13 service.
- [ ] Add the terminal client shell.
- [ ] Add configuration handling.
- [ ] Add `system13ctl`.
- [ ] Add install/deploy/update/rollback scripts.

### Phase 1 — First Connection

- [ ] CRT terminal presentation.
- [ ] Modem initialization sequence.
- [ ] Procedural war-dial intro.
- [ ] First fictional host.
- [ ] Login system.
- [ ] Basic shell commands.
- [ ] Virtual filesystem.
- [ ] Local save/resume.

### Phase 2 — First Scenario

- [ ] Scenario schema and validator.
- [ ] First company.
- [ ] Employees and accounts.
- [ ] Mail, logs, notes, and classified files.
- [ ] Privilege-escalation puzzle chain.
- [ ] Root-access sequence.
- [ ] First endings and rewards.

### Phase 3 — Procedural Expansion

- [ ] Scenario pools.
- [ ] Deterministic run seeds.
- [ ] Multiple host topologies.
- [ ] Randomized clue placement.
- [ ] Rare anomalies.
- [ ] Multiple endings.
- [ ] Replay unlocks and manual dialing.

## Repository Layout

The repository is currently in its initialization stage. The intended high-level layout is:

```text
system-13/
├── client/
├── server/
├── scenarios/
├── public/
├── scripts/
├── packaging/
├── tools/
├── docs/
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── LICENSE
```

Directories will be created as implementation work begins rather than populated with empty placeholders.

## Contributing

SYSTEM 13 is early in development. See [CONTRIBUTING.md](CONTRIBUTING.md) for the current contribution and development guidelines.

## Security

All hacking, privilege escalation, network services, credentials, filesystems, and commands presented by the game are fictional simulations. The browser terminal must never pass player commands to a real operating-system shell.

If a future feature introduces server-side input handling, it must preserve this boundary.

## License

SYSTEM 13 is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE).

---

**SYSTEM 13**

```text
CARRIER DETECTED
CONNECT 1200

REMOTE SYSTEM IDENTIFIED

login:
```
