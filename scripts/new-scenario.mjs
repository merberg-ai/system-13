import fs from "node:fs/promises";
import path from "node:path";

const id = process.argv[2];
if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error("usage: npm run scenario:new -- <lowercase-id>");
  process.exit(2);
}

const root = process.cwd();
const indexPath = path.join(root, "scenarios/index.json");
const dir = path.join(root, "scenarios", id);
const scenarioPath = path.join(dir, "scenario.json");
const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
if (index.some((entry) => entry.id === id)) throw new Error(`scenario already indexed: ${id}`);

const scenario = {
  schemaVersion: 1,
  id,
  version: "0.1.0",
  title: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  company: { name: "New Company", slogan: "Tomorrow Starts Here." },
  startHostId: "node01",
  banner: ["NEW COMPANY REMOTE ACCESS", "", "UNAUTHORIZED ACCESS PROHIBITED"],
  generation: { variables: {} },
  hosts: [{
    id: "node01", hostname: "node01", aliases: [], os: "MSS/IX 1.0", kernel: "1.0.0", architecture: "i386",
    groups: { root: 0, users: 100 },
    users: [
      { id: "root", username: "root", uid: 0, gid: 0, groups: ["root"], home: "/root", shell: "/bin/ysh", password: "!" },
      { id: "guest", username: "guest", uid: 1000, gid: 100, groups: ["users"], home: "/home/guest", shell: "/bin/ysh", password: "visitor" }
    ],
    files: [
      { path: "/root", type: "dir", owner: "root", group: "root", mode: 448 },
      { path: "/home/guest", type: "dir", owner: "guest", group: "users", mode: 493 },
      { path: "/home/guest/README", type: "file", owner: "guest", group: "users", mode: 420, content: "Scenario placeholder." }
    ],
    processes: [{ pid: 1, user: "root", command: "/sbin/init" }], services: [], neighbors: [], commands: []
  }],
  events: []
};

await fs.mkdir(dir, { recursive: false });
await fs.writeFile(scenarioPath, JSON.stringify(scenario, null, 2) + "\n", { flag: "wx" });
index.push({ id, path: `/scenarios/${id}/scenario.json` });
index.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(indexPath, JSON.stringify(index, null, 2) + "\n");
console.log(`Created ${scenarioPath}`);
console.log("Run: npm run scenarios:validate");
