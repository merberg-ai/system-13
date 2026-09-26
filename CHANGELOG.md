# Changelog

All notable changes to SYSTEM 13 will be documented in this file.

The project is currently pre-release.

## Unreleased

### Added

- Initial repository documentation, GPL-3.0 license, architecture notes, and contribution guidelines.
- Node.js 22 / TypeScript / esbuild application scaffold.
- Localhost-only SYSTEM 13 HTTP service with configuration validation, health, version, and maintenance endpoints.
- CRT-style browser terminal with interactive input and command history.
- Seeded modem/war-dial opening sequence and simple WebAudio modem/terminal effects.
- Deterministic named RNG streams and shareable-style run IDs.
- Fake Unix-like engine with users, groups, UIDs, POSIX-like permissions, virtual filesystems, processes, services, host networking, and nested SSH sessions.
- Command parser and initial command set: `help`, `clear`, `pwd`, `cd`, `ls`, `cat`, `whoami`, `id`, `uname`, `hostname`, `history`, `grep`, `find`, `ps`, `env`, `su`, `sudo`, `ssh`, `exit`, `netstat`, `mail`, and `system`.
- Declarative scenario event conditions/actions with no arbitrary scenario code execution.
- IndexedDB player saves with localStorage fallback, autosave, resume, disconnect/reconnect, and new-run handling.
- American Meridian Corporation first scenario with twelve randomly selected classified projects: ORPHEUS, HARVEST, JANUS, COLDSTAR, WATCHTOWER, LAMPLIGHT, CHIMERA, NIGHTGLASS, HOMEFRONT, REDWOOD, PALADIN, and ECHO.
- Complete first guest-to-root progression across `node13` and `archive03`, including a fictional diagnostic privilege-escalation route and first ending.
- Scenario index, schema validation, deterministic generation, authoring documentation, and `npm run scenario:new -- <id>` helper.
- Engine tests covering RNG, parsing, permissions, deterministic generation, and the complete first-run escalation path.
- GitHub Actions checks for shell syntax, TypeScript, scenario validation, tests, and production build.
- Production deployment tooling with a dedicated `system13` account, systemd service, immutable releases, atomic switching, health checks, automatic rollback, backups, and maintenance mode.
- `system13ctl` administrative helper for service control, configuration, scenarios, releases, maintenance, Nginx, SSL, backup, update, rollback, and uninstall operations.
- Isolated Nginx setup for `system13.kj6ywd.net` with `nginx -t` validation before reload.
- Certbot `certonly --webroot` HTTPS setup that does not allow Certbot to rewrite Nginx configuration.
- Deployment and scenario-authoring documentation.

### Changed

- Version advanced to `0.1.0-alpha.1` for first live-host/browser qualification.
- Production systemd deployment now discovers the system-wide Node.js executable instead of assuming `/usr/bin/node`.
- Runtime maintenance state can be changed with a flag file without restarting the daemon.

### Safety

- The in-game command interpreter remains completely separate from the host shell; scenario content and player input cannot invoke host commands.
- Deployment scripts manage only SYSTEM 13-owned paths and the dedicated SYSTEM 13 Nginx virtual host.
