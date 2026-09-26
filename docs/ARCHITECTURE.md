# SYSTEM 13 Architecture

This document records the initial architectural direction for SYSTEM 13. It deliberately describes boundaries and responsibilities rather than prematurely fixing implementation details.

## Core Boundary

SYSTEM 13 presents a convincing command-line environment without exposing a real command-line environment.

```text
PLAYER INPUT
    |
    v
GAME COMMAND PARSER
    |
    +--> virtual filesystem
    +--> fake users / permissions
    +--> fake processes
    +--> fake network hosts
    +--> scenario events
    +--> puzzles / flags
    +--> presentation
    |
    X
REAL HOST SHELL
```

There must be no path from an in-game command to arbitrary host command execution.

## Components

### Browser Client

Responsible for the player-facing game experience:

- terminal renderer
- input/history/editing
- command parsing and dispatch
- fake filesystem navigation
- fake users and permissions
- modem/war-dial presentation
- fake host/network navigation
- event and puzzle handling
- CRT effects and audio
- local save/resume
- in-game SYSTEM 13 client commands

### Service

The production daemon is intended to remain small.

Likely responsibilities:

- serve production browser assets
- load public game configuration
- discover/serve scenario packs
- expose health and version information
- support maintenance mode
- provide optional future server-side capabilities

The initial game should not require server-side player accounts or server-side save data.

### Scenario Engine

The engine should operate on generic concepts rather than named story content:

- company
- facility
- host
- user
- group
- credential
- file
- message
- process
- service
- command
- event
- trigger
- flag
- puzzle
- reward
- ending

Scenario packs provide the actual names, text, relationships, clues, and rules.

The concrete engine design is documented in [ENGINE.md](ENGINE.md).

### Save System

Initial saves should remain in the browser.

A saved run should contain enough information to recreate the same procedural world and restore mutable player state. A likely model is:

```text
save version
engine version
scenario version
run seed
current host
current user
current directory
known credentials
discovered hosts
discovered files
story flags
unlocks
achievements
settings
play statistics
```

Save formats must be versioned so future releases can migrate old runs rather than silently destroying them.

### Production Deployment

Target topology:

```text
Internet
   |
   v
Existing Nginx :80/:443
   |
   +--> existing kj6ywd.net sites (untouched)
   |
   +--> system13.kj6ywd.net
            |
            v
        127.0.0.1:1313
            |
            v
        SYSTEM 13
```

SYSTEM 13 deployment tooling may manage only its own dedicated Nginx virtual host and related ACME webroot/certificate.

Before any Nginx reload:

1. write or stage only the SYSTEM 13 configuration
2. run `nginx -t`
3. abort/rollback on failure
4. reload only after validation succeeds

Normal application updates must not rewrite Nginx configuration.

## Planned Operational Files

Expected production locations:

```text
/opt/system13/
/etc/system13/config.yaml
/var/lib/system13/
/var/lib/system13/backups/
/usr/local/bin/system13ctl
/etc/systemd/system/system13.service
/etc/nginx/sites-available/system13.kj6ywd.net
/etc/nginx/sites-enabled/system13.kj6ywd.net
```

These locations are design targets until deployment tooling is implemented.

## Current Architecture Milestone

The application scaffold is now established on `dev`. The current design milestone is the first browser-side game engine vertical slice described in [ENGINE.md](ENGINE.md), beginning with deterministic state, a fake host, virtual filesystem, users/permissions, command parsing, login, and basic Unix-like commands.
