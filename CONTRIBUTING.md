# Contributing to SYSTEM 13

SYSTEM 13 is currently in pre-alpha development. The project structure, scenario schema, APIs, and development workflow may change rapidly until the first working framework is established.

## Ground Rules

- Keep the fake terminal completely isolated from the host operating system.
- Never pass game commands to a real shell.
- Keep scenario/story content separate from core engine behavior.
- Prefer data-driven features over hard-coded scenario logic.
- Preserve deterministic behavior for seeded runs where practical.
- Do not make deployment tooling modify unrelated Nginx sites, certificates, services, or system configuration.
- Validate configuration before restarting production services.
- Prefer changes that can be rolled back cleanly.

## Development Workflow

Until a formal branching policy is established:

1. Keep `main` in a usable state.
2. Use focused commits with descriptive messages.
3. Document behavior changes.
4. Update the changelog for significant user-visible changes.
5. Add validation/tests when adding parsers, scenario rules, save migrations, or deployment logic.

## Scenario Contributions

The scenario format is not finalized yet. Until the schema and validator land, avoid creating permanent scenario-pack structures that would lock the engine into an early design.

Once scenario authoring is available, scenarios should be:

- self-contained where possible
- deterministic under a known seed
- easy to validate
- free of real credentials or private information
- clearly fictional
- independent of host filesystem paths and host shell commands

## Security Boundary

Player input is untrusted input.

The simulated shell should interpret only game-defined commands and data. It must not execute arbitrary system programs, shell expressions, subprocesses, templates, SQL, or filesystem paths supplied by the player.

## License

By contributing to this repository, you agree that your contributions may be distributed under the project's GNU General Public License v3.0.
