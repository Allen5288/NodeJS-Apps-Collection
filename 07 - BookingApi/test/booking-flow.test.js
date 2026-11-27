// booking-flow.test.js — the booking flow end to end (day 4).
//
// Run: npm test (node --test) from the BookingApi folder.
// Covers what days 1–3 built, through the real HTTP server: create
// (201), double-book (409), validation (400), cancel frees the slot.
// Test dates are in the future (2027-01-15/16): the past-date check
// in validate.js uses the server's local date.
import test from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DATA_FILE = fileURLToPath(new URL("../data/bookings.json", import.meta.url));
const API_KEY = "test-key-salon-2026";

// Fresh store for this file: a leftover bookings file from an
// interrupted run would load stale bookings and change the answers.
rmSync(DATA_FILE, { force: true });
process.env.BOOKING_API_KEY = API_KEY;

const { createServer } = await import("../src/server.js");

let server;
let base;
const auth = { "x-api-key": API_KEY };

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(DATA_FILE, { force: true });
});

function bookingBody(overrides = {}) {
  return {
    serviceId: "haircut",
    date: "2027-01-15",
    time: "10:00",
    customerName: "Alex Chen",
    phone: "0400 000 000",
    ...overrides,
  };
}

async function postBooking(overrides = {}) {
  return fetch(`${base}/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bookingBody(overrides)),
  });
}

test("booking a free slot returns 201 with the booking", async () => {
  const res = await postBooking({ date: "2027-01-15", time: "09:00" });
  assert.equal(res.status, 201);
  const { booking } = await res.json();
  assert.equal(booking.serviceId, "haircut");
  assert.equal(booking.status, "booked");
  assert.equal(typeof booking.id, "string");
  // The slot is gone from the free list immediately.
  const slots = await fetch(`${base}/slots?service=haircut&date=2027-01-15`);
  assert.ok(!(await slots.json()).slots.includes("09:00"));
});

test("booking the same slot twice is 409 SLOT_TAKEN", async () => {
  const first = await postBooking({ date: "2027-01-15", time: "11:00" });
  assert.equal(first.status, 201);
  const second = await postBooking({ date: "2027-01-15", time: "11:00" });
  assert.equal(second.status, 409);
  const body = await second.json();
  assert.equal(body.code, "SLOT_TAKEN");
  assert.equal(typeof body.correlationId, "string");
});

test("a bad phone number is 400 with a details entry for phone", async () => {
  const res = await postBooking({ date: "2027-01-15", time: "13:00", phone: "123" });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.ok(body.details.some((d) => d.field === "phone"));
});

test("a past date is 400, and an unknown field is 400", async () => {
  const past = await postBooking({ date: "2026-01-01", time: "13:00" });
  assert.equal(past.status, 400);
  assert.ok(
    (await past.json()).details.some((d) => d.field === "date"),
  );

  const extra = await postBooking({ date: "2027-01-15", time: "13:00", note: "hi" });
  assert.equal(extra.status, 400);
  assert.ok((await extra.json()).details.some((d) => d.field === "note"));
});

test("cancel with the key frees the slot again", async () => {
  const created = await postBooking({ date: "2027-01-16", time: "10:00" });
  assert.equal(created.status, 201);
  const { booking } = await created.json();

  const slotsBefore = await fetch(`${base}/slots?service=haircut&date=2027-01-16`);
  assert.ok(!(await slotsBefore.json()).slots.includes("10:00"));

  const cancelled = await fetch(`${base}/bookings/${booking.id}`, {
    method: "DELETE",
    headers: auth,
  });
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).booking.status, "cancelled");

  const slotsAfter = await fetch(`${base}/slots?service=haircut&date=2027-01-16`);
  assert.ok((await slotsAfter.json()).slots.includes("10:00"));

  // And the slot can be booked again.
  const rebooked = await postBooking({ date: "2027-01-16", time: "10:00" });
  assert.equal(rebooked.status, 201);
});

test("the day list shows bookings for that date only", async () => {
  await postBooking({ date: "2027-01-16", time: "14:00" });
  const res = await fetch(`${base}/bookings?date=2027-01-16`, { headers: auth });
  assert.equal(res.status, 200);
  const { bookings } = await res.json();
  assert.ok(bookings.length >= 1);
  assert.ok(bookings.every((b) => b.date === "2027-01-16"));
});
