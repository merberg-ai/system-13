# Scenario Authoring

SYSTEM 13 scenario packs are data. They cannot execute JavaScript, shell commands, subprocesses, or host filesystem operations.

## Current format

Schema version 1 uses JSON and an index:

```text
scenarios/
├── index.json
└── american-meridian/
    └── scenario.json
```

Create a new skeleton with:

```bash
npm run scenario:new -- my-company
npm run scenarios:validate
```

## Adding a classified project to American Meridian

The initial conspiracy pool lives at:

```text
scenarios/american-meridian/scenario.json
  generation.variables.project.values
```

Each project currently needs four fields:

```json
{
  "code": "ORPHEUS",
  "name": "Project ORPHEUS",
  "public": "Acoustic communications research",
  "truth": "What was actually happening."
}
```

Add the object to the array and run `npm run scenarios:validate` and `npm test`. No engine code is required.

## Generated variables

Schema 1 supports three deterministic variable generators:

- `choice`: select one item from `values`
- `password`: select a word and append generated digits
- `number`: integer from `min` through `max`

Each variable receives its own named RNG stream. Adding a new unrelated variable therefore does not reshuffle existing variable values for the same run seed.

Generated content can reference variables with tokens such as:

```text
{{project.code}}
{{project.truth}}
{{millerPassword}}
```

Tokens are expanded throughout hosts, files, events, and banner content when the world is generated.

## Hosts

A host defines its fake hostname, OS/kernel identity, users/groups, virtual files, fake processes/services, network neighbors, and host-specific commands.

File modes are stored as decimal JSON numbers corresponding to Unix permission bits. Common values are:

- `493` = `0755`
- `448` = `0700`
- `420` = `0644`
- `384` = `0600`

## Events

Events are declarative `conditions -> actions`. Current conditions include file reads, flags, discovered hosts, current user, root access, and executed commands. Current actions can set flags, discover hosts, record learned credentials, emit terminal output, grant achievements/endings, and spawn fake processes.

This keeps scenario logic testable and prevents story content from becoming executable code.

## Validation

Always run:

```bash
npm run scenarios:validate
npm test
```

CI runs validation, engine tests, TypeScript checking, shell-script syntax checking, and the production build on every push to `dev` and `main`.
