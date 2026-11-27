// auth.test.js — API-key auth for the business routes (day 4).
//
// Run: npm test (node --test) from the BookingApi folder.
// The key is set here, before the server module is imported, so the
// tests exercise the enforced path — not the no-key dev mode.
// Test dates are in the future (2027-02-10): the past-date check in
// validate.js uses the server's local date, and a past date would
// fail validation before auth is ever reached.
import test from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DATA_FILE = fileURLToPath(new URL("../data/bookings.json", import.meta.url));
const API_KEY = "test-key-salon-2026";
const DATE = "2027-02-10";

// Fresh store for this file: a leftover bookings file from an
// interrupted run would load stale bookings and change the answers.
rmSync(DATA_FILE, { force: true });
process.env.BOOKING_API_KEY = API_KEY;

const { createServer } = await import("../src/server.js");

let server;
let base;

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(DATA_FILE, { force: true });
});

async function book(date = DATE, time = "10:00") {
  const res = await fetch(`${base}/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      serviceId: "haircut",
      date,
      time,
      customerName: "Alex Chen",
      phone: "0400 000 000",
    }),
  });
  assert.equal(res.status, 201, "setup booking should succeed");
  return (await res.json()).booking;
}

test("GET /bookings without a key is 401 with the public error shape", async () => {
  const res = await fetch(`${base}/bookings?date=${DATE}`);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.code, "UNAUTHORIZED");
  assert.equal(typeof body.message, "string");
  assert.equal(typeof body.correlationId, "string");
  assert.equal(body.details, undefined); // no details on auth errors
});

test("GET /bookings with a wrong key is 401", async () => {
  const res = await fetch(`${base}/bookings?date=${DATE}`, {
    headers: { "x-api-key": "not-the-key" },
  });
  assert.equal(res.status, 401);
  assert.equal((await res.json()).code, "UNAUTHORIZED");
});

test("GET /bookings with the right key is 200", async () => {
  const res = await fetch(`${base}/bookings?date=${DATE}`, {
    headers: { "x-api-key": API_KEY },
  });
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).bookings, []);
});

test("DELETE without a key is 401 and the booking stays booked", async () => {
  const booking = await book(DATE, "11:00");
  const res = await fetch(`${base}/bookings/${booking.id}`, { method: "DELETE" });
  assert.equal(res.status, 401);
  const list = await fetch(`${base}/bookings?date=${DATE}`, {
    headers: { "x-api-key": API_KEY },
  });
  const found = (await list.json()).bookings.find((b) => b.id === booking.id);
  assert.equal(found.status, "booked");
});

test("DELETE with the key cancels, and an unknown id is 404", async () => {
  const booking = await book(DATE, "13:00");
  const missing = await fetch(`${base}/bookings/does-not-exist`, {
    method: "DELETE",
    headers: { "x-api-key": API_KEY },
  });
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, "NOT_FOUND");

  const res = await fetch(`${base}/bookings/${booking.id}`, {
    method: "DELETE",
    headers: { "x-api-key": API_KEY },
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).booking.status, "cancelled");
});

test("public routes still work with no key", async () => {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const services = await fetch(`${base}/services`);
  assert.equal(services.status, 200);
  assert.equal((await services.json()).services.length, 3);
  const slots = await fetch(`${base}/slots?service=haircut&date=${DATE}`);
  assert.equal(slots.status, 200);
  assert.ok((await slots.json()).slots.includes("09:00"));
});
