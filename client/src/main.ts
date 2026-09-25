function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`required terminal element not found: ${selector}`);
  }

  return element;
}

const output = requireElement<HTMLDivElement>("#terminal-output");
const terminal = requireElement<HTMLElement>("#terminal");

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
