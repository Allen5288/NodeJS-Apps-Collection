# BookingApi — appointment booking API for a small business

A small appointment-booking API for a Sydney salon / clinic — the
kind of business that still takes bookings by phone and loses them
to voicemail. Customers see free slots and book; the business sees
the day's bookings and never double-books a slot.

## What it does for the business

- Lists services with duration and price, so the customer knows
  what they are booking.
- Shows genuinely free slots per service and date — a booked slot
  disappears immediately.
- Books in one call and returns a booking id; cancelling frees the
  slot again.
- Every error uses one public shape (`code`, `message`,
  `correlationId`) — the safe-error-response practice from
  `00 - BestPractiseSummary/02 - Error Handler` (2.14), applied
  instead of just described.

## API

| Method | Path | What it does |
|---|---|---|
| GET | /health | Liveness check |
| GET | /services | List services (duration, price) |
| GET | /slots?service=haircut&date=2026-11-26 | Free slots for that service and day |
| POST | /bookings | Book a slot (201, or 409 SLOT_TAKEN) |
| GET | /bookings?date=2026-11-26 | List bookings, optionally for a day |
| DELETE | /bookings/:id | Cancel a booking, frees the slot |

`POST /bookings` body:

```json
{
  "serviceId": "haircut",
  "date": "2026-11-26",
  "time": "10:00",
  "customerName": "Alex Chen",
  "phone": "0400 000 000"
}
```

## Run it (day 1 — in-memory store)

```bash
cd "07 - BookingApi"
node src/server.js
# in another terminal:
curl localhost:3000/services
curl "localhost:3000/slots?service=haircut&date=2026-11-26"
curl -X POST localhost:3000/bookings -H "Content-Type: application/json" \
  -d '{"serviceId":"haircut","date":"2026-11-26","time":"10:00","customerName":"Alex Chen"}'
```

Node 18+, no dependencies — `node:http` only, no install step.

## Build plan (5 commits)

1. **Scaffold + booking flow (this commit):** README, `package.json`,
   stdlib server with services, slots, book (409 on double-book),
   list and cancel. In-memory store.
2. **Persistence:** bookings survive a restart — JSON file store
   first, then SQLite; no booking lost on deploy.
3. **Validation + error handling:** Zod-style schemas at the
   boundary, the one error shape everywhere, correlation ids in
   logs — the 2.x practices applied to this service.
4. **Auth + tests:** JWT auth for the business side (bookings list,
   cancel), public read for slots; `node --test` coverage of the
   double-booking guard and validation.
5. **Deploy notes + ship checklist:** run as a service, env config,
   backup of the booking file; case finished.
