import type { GameHost, GameUser, VirtualNode } from "../core/types.js";

export function normalizeVirtualPath(cwd: string, input: string, home: string): string {
  let value = input.trim();
  if (value === "") value = home;
  else if (value === "~") value = home;
  else if (value.startsWith("~/")) value = `${home}/${value.slice(2)}`;
  else if (!value.startsWith("/")) value = `${cwd}/${value}`;

  const parts: string[] = [];
  for (const part of value.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") { parts.pop(); continue; }
    parts.push(part);
  }
  return `/${parts.join("/")}`;
}

function permissionBits(node: VirtualNode, user: GameUser): number {
  if (user.uid === 0) return 7;
  if (node.owner === user.username) return (node.mode >> 6) & 7;
  if (user.groups.includes(node.group)) return (node.mode >> 3) & 7;
  return node.mode & 7;
}
export function canRead(node: VirtualNode, user: GameUser): boolean { return (permissionBits(node, user) & 4) !== 0; }
export function canExecute(node: VirtualNode, user: GameUser): boolean { return (permissionBits(node, user) & 1) !== 0; }
export function getNode(host: GameHost, path: string): VirtualNode | undefined { return host.files[path]; }
export function listDirectory(host: GameHost, path: string): Array<{ name: string; node: VirtualNode }> {
  const prefix = path === "/" ? "/" : `${path}/`;
  const children = new Map<string, VirtualNode>();
  for (const [candidatePath, node] of Object.entries(host.files)) {
    if (!candidatePath.startsWith(prefix) || candidatePath === path) continue;
    const remainder = candidatePath.slice(prefix.length);
    if (!remainder || remainder.includes("/")) continue;
    children.set(remainder, node);
  }
  return [...children.entries()].map(([name, node]) => ({ name, node })).sort((a, b) => a.name.localeCompare(b.name));
}
export function modeString(node: VirtualNode): string {
  const chars = [node.type === "dir" ? "d" : "-"];
  for (const shift of [6, 3, 0]) {
    const bits = (node.mode >> shift) & 7;
    chars.push((bits & 4) ? "r" : "-"); chars.push((bits & 2) ? "w" : "-"); chars.push((bits & 1) ? "x" : "-");
  }
  return chars.join("");
}
export function basename(path: string): string { return path === "/" ? "/" : path.split("/").filter(Boolean).at(-1) ?? "/"; }
export function displayPath(cwd: string, home: string): string {
  if (cwd === home) return "~";
  if (cwd.startsWith(`${home}/`)) return `~${cwd.slice(home.length)}`;
  return cwd;
}
export function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}
