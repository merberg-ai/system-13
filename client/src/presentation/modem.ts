import { rngStream } from "../engine/rng/rng.js";
import type { TerminalUI } from "../terminal/terminal.js";
import type { SoundEngine } from "./sound.js";

function numberFor(index: number, suffix: number): string {
  const block = String((index * 137 + suffix * 43 + 1703) % 10000).padStart(4, "0");
  return `555-${block}`;
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

export async function runWarDial(ui: TerminalUI, sound: SoundEngine, seed: string): Promise<void> {
  const rng = rngStream(seed, "war-dial");

  ui.clear();
  ui.write("SYSTEM 13 REMOTE ACCESS CLIENT");
  ui.write("");
  ui.write("MODEM INITIALIZED");
  ui.write("1200 BAUD");
  ui.write("AUTO-DIALER READY");
  ui.write("");
  await ui.pause(320);

  // Richer telephone audio makes each attempt longer, so keep the scan compact.
  const attempts = rng.integer(4, 6);

  for (let index = 0; index < attempts; index += 1) {
    const number = numberFor(index, rng.integer(0, 99));
    const busy = rng.integer(0, 4) === 0;

    ui.write(`DIALING ${number}...`);
    await dialNumber(ui, sound, number);

    if (busy) {
      sound.busy();
      await ui.pause(760);
      ui.write("BUSY");
      ui.write("");
      await ui.pause(240);
      continue;
    }

    await ringFourTimes(ui, sound);
    ui.write(rng.pick(["NO CARRIER", "NO ANSWER"] as const));
    ui.write("");
    await ui.pause(280);
  }

  const successfulNumber = `555-13${rng.integer(10, 99)}`;
  ui.write(`DIALING ${successfulNumber}...`);
  await dialNumber(ui, sound, successfulNumber);

  // The answering system picks up quickly: one abbreviated ring, then negotiation.
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
