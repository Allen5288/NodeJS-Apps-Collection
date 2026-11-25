// BookingApi — appointment booking API for a small business (salon / clinic).
// Stdlib only (node:http), no dependencies. Run: node src/server.js
// Bookings persist in data/bookings.json (see store.js) — they survive a restart.
import http from "node:http";
import { randomUUID } from "node:crypto";
import { loadBookings, saveBookings } from "./store.js";

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

function error(res, status, code, message, correlationId) {
  // One public error shape (see 2.14 safe error responses): no internals leak.
  send(res, status, { code, message, correlationId });
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
      const { serviceId, date, time, customerName, phone } = body;
      if (!services.some((s) => s.id === serviceId)) {
        return error(res, 400, "VALIDATION_ERROR", "unknown serviceId", correlationId);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !slotTimes.includes(time)) {
        return error(res, 400, "VALIDATION_ERROR", "date must be YYYY-MM-DD and time must be a listed slot", correlationId);
      }
      if (typeof customerName !== "string" || customerName.trim().length < 2) {
        return error(res, 400, "VALIDATION_ERROR", "customerName is required", correlationId);
      }
      if (!freeSlots(serviceId, date).includes(time)) {
        // Double-booking guard: the slot is already taken.
        return error(res, 409, "SLOT_TAKEN", "that slot is already booked", correlationId);
      }
      const booking = {
        id: randomUUID(),
        serviceId,
        date,
        time,
        customerName: customerName.trim(),
        phone: phone ?? null,
        status: "booked",
        createdAt: new Date().toISOString(),
      };
      bookings.push(booking);
      saveBookings(bookings);
      return send(res, 201, { booking });
    }
    if (req.method === "GET" && url.pathname === "/bookings") {
      const date = url.searchParams.get("date");
      const list = date ? bookings.filter((b) => b.date === date) : bookings;
      return send(res, 200, { bookings: list });
    }
    if (req.method === "DELETE" && url.pathname.startsWith("/bookings/")) {
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

server.listen(PORT, () => {
  console.log(`BookingApi listening on http://localhost:${PORT}`);
});
