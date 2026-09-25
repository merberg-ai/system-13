import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const dist = path.join(root, "dist");
const packageJson = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8")
);

const define = {
  __SYSTEM13_VERSION__: JSON.stringify(packageJson.version)
};

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(path.join(dist, "server"), { recursive: true });
await fs.mkdir(path.join(dist, "public"), { recursive: true });

await build({
  entryPoints: [path.join(root, "server/src/index.ts")],
  outfile: path.join(dist, "server/index.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  define
});

await build({
  entryPoints: [path.join(root, "server/src/validate-config.ts")],
  outfile: path.join(dist, "server/validate-config.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  define
});

await build({
  entryPoints: [path.join(root, "client/src/main.ts")],
  outfile: path.join(dist, "public/app.js"),
  bundle: true,
  platform: "browser",
  format: "esm",
  target: ["es2022"],
  sourcemap: true
});

await Promise.all([
  fs.copyFile(
    path.join(root, "client/index.html"),
    path.join(dist, "public/index.html")
  ),
  fs.copyFile(
    path.join(root, "client/styles.css"),
    path.join(dist, "public/styles.css")
  ),
  fs.copyFile(
    path.join(root, "config.example.yaml"),
    path.join(dist, "config.example.yaml")
  )
]);

console.log(`SYSTEM 13 ${packageJson.version} build complete: ${dist}`);
