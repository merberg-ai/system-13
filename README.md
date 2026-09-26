# SYSTEM 13

> A browser-based retro terminal hacking adventure with procedural mysteries, fake Linux systems, corporate conspiracies, and locally saved randomized scenarios.

**Status:** `0.1.0-alpha.1` on the `dev` branch — first playable alpha, ready for live-host/browser testing.

SYSTEM 13 is a browser game built around the illusion of discovering forgotten computer systems through an old modem connection. The player begins by war-dialing a fictional phone range, connects to an unknown corporate system, gains limited user access, explores a simulated Unix-like environment, discovers fictional vulnerabilities and credentials, pivots between fake hosts, and works toward root access and classified material.

**The terminal is the game world.**

SYSTEM 13 never executes player commands in a real operating-system shell. Commands operate only on game-controlled users, files, processes, services, hosts, permissions, events, and state.

## First Playable Scenario

The initial scenario is **American Meridian Corporation**, an aggressively wholesome industrial/research conglomerate with a less wholesome BLACK archive.

A seeded run selects from a pool of classified projects including:

- ORPHEUS
- HARVEST
- JANUS
- COLDSTAR
- WATCHTOWER
- LAMPLIGHT
- CHIMERA
- NIGHTGLASS
- HOMEFRONT
- REDWOOD
- PALADIN
- ECHO

The project, incident, government partner, personnel names, credentials, and anomalies are generated deterministically from the run seed.

The current first-run progression supports a complete playable path:

```text
WAR DIAL
   |
   v
NODE13 LOGIN
   |
   v
GUEST ACCESS
   |
   v
DISCOVER LEGACY BACKUP CREDENTIALS
   |
   v
MILLER ACCOUNT
   |
   v
DISCOVER ARCHIVE03
   |
   v
SSH TO ARCHIVE03
   |
   v
FIND FICTIONAL DIAGNOSTIC BACKDOOR
   |
   v
ROOT
   |
   v
BLACK RETENTION FILE
   |
   v
ENDING
```

The complete escalation route is covered by an automated engine test.

## Current Engine

The browser client currently includes:

- CRT-style terminal presentation
- modem/war-dial intro
- login and password states
- command parser with quoting/escaping
- fake users, groups, UIDs and POSIX-like permissions
- virtual filesystems per host
- fake processes and services
- fake host/network topology
- nested SSH session stack
- `su` and fictional privilege escalation
- declarative story conditions/actions
- deterministic named RNG streams
- seeded scenario generation
- IndexedDB saves with localStorage fallback
- resume/new-run handling
- run IDs
- achievements/endings
- host-specific fictional utilities

Implemented shell commands currently include:

```text
help clear pwd cd ls cat whoami id uname hostname history
grep find ps env su sudo ssh exit netstat mail system
```

Scenario packs may expose additional fictional commands, such as the American Meridian `diagctl` utility.

## Architecture

SYSTEM 13 separates authored content, generated content, player state, and presentation:

```text
ScenarioDefinition
       |
       | + deterministic seed
       v
GeneratedWorld
       |
       | + player actions
       v
RunState
       |
       v
Terminal / Presentation
```

Scenario content is data rather than executable code. See:

- [Engine design](docs/ENGINE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Scenario system](docs/SCENARIOS.md)
- [Scenario authoring](docs/SCENARIO_AUTHORING.md)

## Development

Requirements:

- Node.js 22+
- npm

Run the development branch:

```bash
git clone https://github.com/merberg-ai/system-13.git
cd system-13
git checkout dev
./scripts/dev.sh
```

Then open:

```text
http://127.0.0.1:1313
```

Run all checks/builds with:

```bash
npm run check
npm run scenarios:validate
npm test
./scripts/build.sh
```

Create a new scenario skeleton with:

```bash
npm run scenario:new -- my-company
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for more detail.

## Production Target

The intended public deployment is:

```text
https://system13.kj6ywd.net
```

SYSTEM 13 binds only to `127.0.0.1:1313` and sits behind Nginx.

The deployment tooling follows one hard rule:

> Existing web services are production infrastructure. SYSTEM 13 may create and manage its own dedicated virtual host, but it must not modify unrelated Nginx sites, certificates, or application configuration.

Certbot is invoked in `certonly --webroot` mode. SYSTEM 13 never invokes `certbot --nginx`.

### Development-channel install

Until the first release is promoted to `main`:

```bash
curl -fsSL https://raw.githubusercontent.com/merberg-ai/system-13/dev/scripts/install.sh \
  | sudo env SYSTEM13_BRANCH=dev bash
```

The deployment system provides:

- dedicated `system13` service account
- systemd service
- immutable release directories
- atomic `current` symlink switching
- pre-deploy type checking, scenario validation, tests, and build
- localhost health checks
- automatic release rollback after failed health checks
- preserved `/etc/system13/config.yaml`
- runtime maintenance flag
- dedicated Nginx vhost only
- `nginx -t` before reload
- Certbot webroot issuance
- safe update/rollback/uninstall tooling

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before the first live installation.

## Administration

The production helper currently supports:

```text
system13ctl status
system13ctl start
system13ctl stop
system13ctl restart
system13ctl logs
system13ctl health
system13ctl version

system13ctl maintenance status
system13ctl maintenance on
system13ctl maintenance off

system13ctl config show
system13ctl config edit
system13ctl config validate

system13ctl scenario validate

system13ctl update
system13ctl rollback
system13ctl releases
system13ctl backup

system13ctl nginx test
system13ctl nginx show
system13ctl ssl status
system13ctl ssl setup

system13ctl uninstall
```

## Automated Validation

GitHub Actions currently checks every push to `dev` and `main` for:

- shell-script syntax
- TypeScript correctness
- scenario validation
- engine tests
- production build

Scenario validation checks the scenario index, host references, generated world construction, and basic event references. The test suite includes deterministic RNG/parser coverage and an end-to-end American Meridian privilege-escalation run.

## Roadmap

### Foundation / first playable

- [x] Repository/docs/license
- [x] Node/TypeScript service scaffold
- [x] CRT browser terminal
- [x] deterministic engine state
- [x] fake users/permissions/filesystem
- [x] basic Unix-like command set
- [x] fake processes/services/networking
- [x] login, `su`, and SSH session flow
- [x] declarative event system
- [x] seeded generation
- [x] local autosave/resume
- [x] modem/war-dial intro
- [x] first American Meridian scenario
- [x] full guest-to-root progression
- [x] scenario validator/tests
- [x] install/deploy/update/rollback tooling
- [x] isolated Nginx/Certbot deployment tooling
- [ ] first live-host/browser qualification

### Next expansion

- [ ] deeper/randomized clue routes
- [ ] multiple host topologies
- [ ] more endings and rewards
- [ ] rare run anomalies
- [ ] manual dialing and discoverable numbers
- [ ] richer mail/log utilities
- [ ] additional companies/scenario packs
- [ ] replay unlocks and cosmetics
- [ ] expanded terminal/audio effects

## Security Boundary

All hacking, privilege escalation, network services, credentials, filesystems, and commands shown by the game are fictional simulations.

```text
PLAYER INPUT
    |
    v
GAME COMMAND INTERPRETER
    |
    +--> virtual filesystem
    +--> fake users / permissions
    +--> fake processes / services
    +--> fake network hosts
    +--> scenario state
    |
    X
REAL HOST SHELL
```

That boundary is a project requirement, not merely an implementation detail.

## License

SYSTEM 13 is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE).

---

```text
SYSTEM 13

CARRIER DETECTED
CONNECT 1200

REMOTE SYSTEM IDENTIFIED

login:
```
