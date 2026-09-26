function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRng {
  private readonly nextValue: () => number;

  constructor(seed: string) {
    this.nextValue = mulberry32(fnv1a(seed));
  }

  next(): number {
    return this.nextValue();
  }

  integer(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error("invalid integer range");
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new Error("cannot pick from an empty list");
    }
    return values[this.integer(0, values.length - 1)] as T;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

export function rngStream(masterSeed: string, stream: string): SeededRng {
  return new SeededRng(`${masterSeed}::${stream}`);
}

export function randomSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function runIdFromSeed(seed: string): string {
  const compact = seed.replace(/[^A-Fa-f0-9]/g, "").toUpperCase().padEnd(8, "0");
  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}
