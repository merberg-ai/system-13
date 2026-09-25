const output = document.querySelector<HTMLDivElement>("#terminal-output");
const terminal = document.querySelector<HTMLElement>("#terminal");

if (!output || !terminal) {
  throw new Error("terminal DOM is incomplete");
}

const lines = [
  "SYSTEM 13 // PRE-ALPHA",
  "",
  "TERMINAL SUBSYSTEM ........ ONLINE",
  "GAME ENGINE ............... NOT LOADED",
  "SCENARIO .................. NONE",
  "",
  "Framework initialized.",
  ""
];

function render(): void {
  output.textContent = lines.join("\n");
}

render();
terminal.focus();
