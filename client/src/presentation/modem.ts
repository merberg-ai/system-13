import { rngStream } from "../engine/rng/rng.js";
import type { DialOutcome } from "../local/shell.js";
import type { TerminalUI } from "../terminal/terminal.js";
import type { SoundEngine } from "./sound.js";

export interface WarDialAttempt {
  number: string;
  outcome: DialOutcome;
}

export interface WarDialPlan {
  attempts: WarDialAttempt[];
  successfulNumber: string;
}

function numberFor(index: number, suffix: number): string {
  const block = String((index * 137 + suffix * 43 + 1703) % 10000).padStart(4, "0");
  return `555-${block}`;
}

export function planWarDial(seed: string): WarDialPlan {
  const rng = rngStream(seed, "war-dial");
  const attempts: WarDialAttempt[] = [];

  // A scan should always feel like a search: at least one failed call, but
  // enough variation that repeated scans do not settle into an obvious rhythm.
  const count = rng.integer(1, 8);

  for (let index = 0; index < count; index += 1) {
    const number = numberFor(index, rng.integer(0, 99));
    const busy = rng.integer(0, 4) === 0;
    const outcome: DialOutcome = busy ? "BUSY" : rng.pick(["NO CARRIER", "NO ANSWER"] as const);
    attempts.push({ number, outcome });
  }

  return {
    attempts,
    successfulNumber: `555-13${rng.integer(10, 99)}`
  };
}

async function dialNumber(ui: TerminalUI, sound: SoundEngine, number: string): Promise<void> {
  sound.dialTone(220);
  await ui.pause(250);

  for (const digit of number) {
    if (!/\d/.test(digit)) continue;
    sound.dtmf(digit, 86);
    await ui.pause(120);
  }
}

async function ringFourTimes(ui: TerminalUI, sound: SoundEngine): Promise<void> {
  for (let ring = 0; ring < 4; ring += 1) {
    ui.write("RINGING...");
    sound.ring(340);
    await ui.pause(610);
  }
}

async function completeConnection(ui: TerminalUI, sound: SoundEngine): Promise<void> {
  ui.write("RINGING...");
  sound.ring(260);
  await ui.pause(520);
  ui.write("");
  ui.write("CARRIER DETECTED");
  sound.handshake();
  await ui.pause(1750);
  ui.write("CONNECT 1200");
  ui.write("");
  await ui.pause(420);
}

export async function dialKnownTarget(ui: TerminalUI, sound: SoundEngine, number: string): Promise<void> {
  ui.write(`ATDT${number.replace(/\D/g, "")}`);
  ui.write(`DIALING ${number}...`);
  await dialNumber(ui, sound, number);
  await completeConnection(ui, sound);
}

export async function dialUnknownTarget(
  ui: TerminalUI,
  sound: SoundEngine,
  number: string
): Promise<DialOutcome> {
  ui.write(`ATDT${number.replace(/\D/g, "")}`);
  ui.write(`DIALING ${number}...`);
  await dialNumber(ui, sound, number);
  await ringFourTimes(ui, sound);
  ui.write("NO CARRIER");
  ui.write("");
  return "NO CARRIER";
}

export async function runWarDial(ui: TerminalUI, sound: SoundEngine, seed: string): Promise<WarDialPlan> {
  const plan = planWarDial(seed);

  ui.clear();
  ui.write("SYSTEM 13 REMOTE ACCESS CLIENT");
  ui.write("");
  ui.write("MODEM INITIALIZED");
  ui.write("1200 BAUD");
  ui.write("AUTO-DIALER READY");
  ui.write("");
  await ui.pause(320);

  for (const attempt of plan.attempts) {
    ui.write(`DIALING ${attempt.number}...`);
    await dialNumber(ui, sound, attempt.number);

    if (attempt.outcome === "BUSY") {
      sound.busy();
      await ui.pause(760);
      ui.write("BUSY");
      ui.write("");
      await ui.pause(240);
      continue;
    }

    await ringFourTimes(ui, sound);
    ui.write(attempt.outcome);
    ui.write("");
    await ui.pause(280);
  }

  ui.write(`DIALING ${plan.successfulNumber}...`);
  await dialNumber(ui, sound, plan.successfulNumber);
  await completeConnection(ui, sound);
  return plan;
}
