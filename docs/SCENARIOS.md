# Scenario System

SYSTEM 13 is intended to support a growing pool of procedural corporate-conspiracy stories without requiring changes to the core engine for every new scenario.

This document captures the design goals before the schema is finalized.

## Principle

**Story content is data. Game mechanics are engine behavior.**

A scenario pack should be able to describe a mystery using generic engine concepts instead of custom JavaScript or server code wherever practical.

## Initial Content Model

A scenario may eventually provide:

- company identity and branding
- facility names and locations
- departments
- employees
- accounts and access levels
- hosts and network topology
- virtual filesystems
- mail/messages
- logs
- fake services and processes
- credentials
- clues
- puzzle requirements
- fictional vulnerabilities
- story events
- escalation paths
- endings
- rewards
- rare anomalies

## Procedural Runs

A new run should be generated from a deterministic seed.

Given compatible engine/scenario versions and the same seed, static generated content should be reproducible. Mutable player state is then stored separately in the save.

This makes it possible to support shareable run IDs later.

## Validation

Scenario packs should eventually have a validator that can detect issues such as:

- duplicate IDs
- missing referenced hosts/users/files
- impossible credential chains
- unreachable required clues
- invalid permissions
- circular prerequisites
- missing endings
- malformed virtual paths
- unsupported commands/events
- schema-version mismatches

## Extensibility

The first release will begin small: one company and a limited scenario pool.

The format should nevertheless allow future additions such as multiple companies, different eras, different host families, alternative visual identities, unrelated conspiracy themes, and special rare scenarios.

## Safety

Scenario content may depict fictional hacking and privilege escalation, but scenario commands must remain operations against simulated game objects. Scenario data must never be able to invoke arbitrary host commands or access arbitrary host paths.

## Status

The concrete directory structure and schema have intentionally not been finalized yet. They will be designed alongside the first working engine so the format reflects actual requirements rather than guesses.
