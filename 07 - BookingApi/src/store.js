// store.js — JSON file store for BookingApi bookings.
//
// Day 1 kept bookings in memory: restart the server and every
// booking vanished. This store persists them to data/bookings.json
// so a restart (or a deploy) loses nothing. It is deliberately
// small: load once at startup, save after every mutation.
//
// Rules the store follows:
// - Atomic writes: write to a temp file, then rename over the real
//   file. A crash mid-write leaves the old file intact, never a
//   half-written JSON file.
// - A corrupt file does not kill the server: load logs a warning
//   and starts empty, so one bad deploy does not take down the
//   whole booking service (the corrupt file is left in place for
//   a human to inspect, not silently overwritten).
// - The store owns the shape: only plain JSON-serialisable booking
//   objects go in, so what is saved is exactly what is loaded.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
export const DATA_FILE = join(DATA_DIR, "bookings.json");

export function loadBookings() {
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`[store] ${DATA_FILE} is not an array — starting empty`);
      return [];
    }
    return parsed;
  } catch (err) {
    if (err.code === "ENOENT") return []; // first run: no file yet
    console.warn(`[store] could not load ${DATA_FILE} (${err.message}) — starting empty`);
    return [];
  }
}

export function saveBookings(bookings) {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.tmp`;
  writeFileSync(tmpFile, JSON.stringify(bookings, null, 2));
  renameSync(tmpFile, DATA_FILE); // atomic on the same filesystem
}
