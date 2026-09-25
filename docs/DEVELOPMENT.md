# Development

The initial SYSTEM 13 scaffold uses a deliberately small stack:

- Node.js 22 or newer
- TypeScript
- esbuild
- tsx for development reloads
- Node's built-in HTTP server
- vanilla browser TypeScript/CSS
- YAML configuration

No application framework, database, template engine, or server-side player session system is required at this stage.

## First Run

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

The development launcher installs npm dependencies on first use, watches the browser TypeScript bundle, watches/restarts the server TypeScript entry point, and runs the service with `config.example.yaml`. HTML and CSS are linked directly into the temporary development public directory.

## Build

```bash
./scripts/build.sh
```

The build performs a TypeScript check and then creates:

```text
dist/
├── config.example.yaml
├── public/
│   ├── app.js
│   ├── app.js.map
│   ├── index.html
│   └── styles.css
└── server/
    ├── index.js
    ├── index.js.map
    ├── validate-config.js
    └── validate-config.js.map
```

Run the production bundle locally with:

```bash
SYSTEM13_CONFIG="$PWD/config.example.yaml" npm start
```

## Service Endpoints

### `GET /health`

Returns basic service health, version, maintenance state, and process uptime.

### `GET /version`

Returns the SYSTEM 13 service version.

### `GET /maintenance`

Returns the configured maintenance state.

These endpoints are operational endpoints, not game-engine APIs.

## Configuration

The service reads configuration in this order:

1. the path in `SYSTEM13_CONFIG`
2. `./config.yaml` when present
3. `./config.example.yaml`

Production deployment will explicitly set `SYSTEM13_CONFIG=/etc/system13/config.yaml`.

## Source Layout

```text
client/
├── index.html
├── styles.css
└── src/
    └── main.ts

server/
└── src/
    ├── config.ts
    ├── index.ts
    └── validate-config.ts

scripts/
├── build.mjs
├── build.sh
└── dev.sh

tools/
└── system13ctl
```

## Current Boundary

The client currently renders only a placeholder terminal screen. There is no fake shell, filesystem, scenario engine, modem engine, save system, or gameplay logic yet.

That is intentional. The next design milestone is the game engine itself.
