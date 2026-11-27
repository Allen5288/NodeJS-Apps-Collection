// BookingApi — appointment booking API for a small business (salon / clinic).
// Stdlib only (node:http), no dependencies. Run: node src/server.js
// Bookings persist in data/bookings.json (see store.js) — they survive a restart.
// Validation lives in validate.js: every booking request passes through it
// before it touches the store, and every error uses the one public shape
// (code, message, correlationId, details) from the 2.14 practice.
// Auth lives in auth.js: the business routes (list bookings, cancel) need
// the salon's API key (x-api-key header, BOOKING_API_KEY env var); the
// customer routes (services, slots, booking) stay public. Tests:
// npm test (node --test, see test/).
import http from "node:http";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadBookings, saveBookings } from "./store.js";
import { validateBooking } from "./validate.js";
import { authStatusLine, checkApiKey } from "./auth.js";

const PORT = process.env.PORT || 3000;

const services = [
  { id: "haircut", name: "Haircut", durationMin: 45, priceAud: 65 },
  { id: "colour", name: "Colour + cut", durationMin: 120, priceAud: 180 },
  { id: "consult", name: "Consultation", durationMin: 30, priceAud: 0 },
];

// Slots are per service per date; a slot is a "09:00" style start time.
const slotTimes = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const bookings = loadBookings(); // { id, serviceId, date, time, customerName, phone, status, createdAt }

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(payload);
}

function error(res, status, code, message, correlationId, details) {
  // One public error shape (see 2.14 safe error responses): no internals leak.
  // `details` is present only for validation errors — one entry per bad field,
  // so the client can fix the request instead of guessing what was wrong.
  const body = { code, message, correlationId };
  if (details) body.details = details;
  send(res, status, body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy(); // cap body size
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function freeSlots(serviceId, date) {
  const taken = new Set(
    bookings
      .filter((b) => b.serviceId === serviceId && b.date === date && b.status === "booked")
      .map((b) => b.time),
  );
  return slotTimes.filter((t) => !taken.has(t));
}

export function createServer() {
  const server = http.createServer(async (req, res) => {
    const correlationId = randomUUID();
    const url = new URL(req.url, `http://${req.headers.host}`);
    console.log(`${req.method} ${url.pathname} [${correlationId}]`);
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        return send(res, 200, { status: "ok" });
      }
      if (req.method === "GET" && url.pathname === "/services") {
        return send(res, 200, { services });
      }
      if (req.method === "GET" && url.pathname === "/slots") {
        const serviceId = url.searchParams.get("service");
        const date = url.searchParams.get("date");
        if (!services.some((s) => s.id === serviceId) || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
          return error(res, 400, "VALIDATION_ERROR", "service and date=YYYY-MM-DD are required", correlationId);
        }
        return send(res, 200, { serviceId, date, slots: freeSlots(serviceId, date) });
      }
      if (req.method === "POST" && url.pathname === "/bookings") {
        const body = await readBody(req);
        // All booking validation lives in validate.js — the handler
        // only sees a clean value or a list of field errors.
        const checked = validateBooking(body, services, slotTimes);
        if (!checked.ok) {
          return error(
            res,
            400,
            "VALIDATION_ERROR",
            "booking request failed validation",
            correlationId,
            checked.errors,
          );
        }
        const { serviceId, date, time, customerName, phone } = checked.value;
        if (!freeSlots(serviceId, date).includes(time)) {
          // Double-booking guard: the slot is already taken.
          return error(res, 409, "SLOT_TAKEN", "that slot is already booked", correlationId);
        }
        const booking = {
          id: randomUUID(),
          serviceId,
          date,
          time,
          customerName,
          phone,
          status: "booked",
          createdAt: new Date().toISOString(),
        };
        bookings.push(booking);
        saveBookings(bookings);
        return send(res, 201, { booking });
      }
      if (req.method === "GET" && url.pathname === "/bookings") {
        // Business route: the salon's day sheet, not public.
        const auth = checkApiKey(req);
        if (!auth.ok) {
          return error(res, auth.status, auth.code, auth.message, correlationId);
        }
        const date = url.searchParams.get("date");
        const list = date ? bookings.filter((b) => b.date === date) : bookings;
        return send(res, 200, { bookings: list });
      }
      if (req.method === "DELETE" && url.pathname.startsWith("/bookings/")) {
        // Business route: only the salon cancels a booking.
        const auth = checkApiKey(req);
        if (!auth.ok) {
          return error(res, auth.status, auth.code, auth.message, correlationId);
        }
        const id = url.pathname.split("/")[2];
        const booking = bookings.find((b) => b.id === id);
        if (!booking) {
          return error(res, 404, "NOT_FOUND", "booking not found", correlationId);
        }
        booking.status = "cancelled";
        saveBookings(bookings);
        return send(res, 200, { booking });
      }
      return error(res, 404, "NOT_FOUND", "route not found", correlationId);
    } catch (err) {
      // Never leak internals: log server-side, return a generic 500.
      console.error(`[${correlationId}]`, err);
      return error(res, 500, "INTERNAL_ERROR", "something went wrong", correlationId);
    }
  });
  return server;
}

// Only listen when run directly (`node src/server.js`). Importing the
// module (tests do this) builds the server without starting it, so
// tests can listen on an ephemeral port instead.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`BookingApi listening on http://localhost:${PORT}`);
    console.log(authStatusLine());
  });
}
