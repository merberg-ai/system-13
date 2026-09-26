import type { CommandInvocation } from "../core/types.js";

export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaping = false;

  const push = () => {
    if (current.length > 0) {
      tokens.push(current);
      current = "";
    }
  };

  for (const char of line.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\" && quote !== "'") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      push();
      continue;
    }

    current += char;
  }

  if (escaping) {
    current += "\\";
  }

  if (quote) {
    throw new Error("unterminated quote");
  }

  push();
  return tokens;
}

export function parseCommand(line: string): CommandInvocation | null {
  const tokens = tokenize(line);
  if (tokens.length === 0) {
    return null;
  }
  return {
    raw: line,
    name: tokens[0]!.toLowerCase(),
    args: tokens.slice(1)
  };
}
