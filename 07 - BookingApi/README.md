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
- Bookings survive a restart — they are stored in
  `data/bookings.json` (see `src/store.js`), so a deploy never
  loses the day's appointments.
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

## Run it (day 3 — validation + error handling)

```bash
cd "07 - BookingApi"
node src/server.js
# in another terminal:
curl localhost:3000/services
curl "localhost:3000/slots?service=haircut&date=2026-11-26"
curl -X POST localhost:3000/bookings -H "Content-Type: application/json" \
  -d '{"serviceId":"haircut","date":"2026-11-26","time":"10:00","customerName":"Alex Chen"}'
# restart the server, then:
curl "localhost:3000/bookings?date=2026-11-26"   # the booking is still there
cat data/bookings.json                          # the file behind it
```

Node 18+, no dependencies — `node:http` only, no install step.

## Persistence — how it works, and its limits

- `src/store.js` loads `data/bookings.json` once at startup and
  saves it after every book and cancel. Writes are atomic (temp
  file + rename), so a crash mid-write never corrupts the file.
- A missing file means first run — the store starts empty. A
  corrupt file logs a warning and starts empty; the corrupt file
  is left in place for a human to inspect.
- Limits, stated plainly: one server process only (two processes
  would overwrite each other's saves), and the whole file is
  rewritten on every change — fine for a salon's dozens of
  bookings a day, wrong for thousands. SQLite is the next step
  (see the build plan), and it fixes both.

## Build plan (5 commits)

1. **Scaffold + booking flow (done 2026-11-25):** README,
   `package.json`, stdlib server with services, slots, book (409
   on double-book), list and cancel. In-memory store.
2. **Persistence (this commit):** bookings survive a restart —
   JSON file store with atomic writes; no booking lost on deploy.
3. **Validation + error handling (done 2026-11-27):** Zod-style schemas at the
   boundary (see `src/validate.js`), the one error shape everywhere
   with a `details` array, correlation ids in logs — the 2.x practices
      applied to this service.
4. **Auth + tests:** JWT auth for the business side (bookings list,
   cancel), public read for slots; `node --test` coverage of the
   double-booking guard and validation.
5. **Deploy notes + ship checklist:** run as a service, env config,
   backup of the booking file; case finished.




## Validation + error handling (day 3)

Days 1–2 validated inline in `server.js` — a few `if`s in the
booking handler. That works for one route and rots for five: the
same date check copied into every handler, each copy slightly
different. Day 3 moves validation to the boundary, into
`src/validate.js`, so the handler only ever sees a clean value or
a list of field errors.

### The rules

| Rule | Why |
|---|---|
| Unknown fields rejected, not dropped | A client sending `emai` instead of `email` gets a 400, not a booking with no contact (same rule as the AWS Register API, 2026-11-23) |
| Date must be a real calendar date, `YYYY-MM-DD` | `2026-02-30` is not a date — the `Date` round-trip check catches the rollover |
| Date must not be in the past | A booking for yesterday is a data error the business finds out about at the door |
| Time must be a listed slot | The slot list is the business's opening hours; anything else is not bookable |
| Name 2–100 chars, trimmed | A callback needs a name; a 5,000-char name is a cheap denial of service on the JSON file store |
| Phone optional, but if present must be Australian | Mobile `04XX` or landline `02/03/07/08`, with or without `+61`. The salon calls the customer back — a wrong number is a no-show nobody can prevent. Stored normalised, so `0400 000 000` and `0400000000` are the same number |

### The error shape, extended

Validation failures now carry a `details` array — one entry per
bad field — so the client can fix the request instead of guessing:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "booking request failed validation",
  "correlationId": "9f2c4a1e-…",
  "details": [
    { "field": "date", "issue": "date must not be in the past" },
    { "field": "phone", "issue": "phone must be an Australian number, e.g. 0400 000 000" }
  ]
}
```

`details` is present only for validation errors. Every other error
keeps the same three fields as before — the shape grows by addition,
never by changing what a client already handles. And the messages
name the field and the rule, never a stack trace or a file path:
internals stay in the server log, next to the correlation id.

### Try it

```bash
curl -X POST localhost:3000/bookings -H "Content-Type: application/json" \
  -d '{"serviceId":"haircut","date":"2026-11-26","time":"10:00","customerName":"Alex Chen","phone":"0400 000 000"}'
# -> 400 VALIDATION_ERROR, details: date must not be in the past (26 Nov is gone)

curl -X POST localhost:3000/bookings -H "Content-Type: application/json" \
  -d '{"serviceId":"haircut","date":"2026-12-01","time":"10:00","customerName":"Alex Chen","phone":"123"}'
# -> 400 VALIDATION_ERROR, details: phone must be an Australian number

curl -X POST localhost:3000/bookings -H "Content-Type: application/json" \
  -d '{"serviceId":"haircut","date":"2026-12-01","time":"10:00","customerName":"Alex Chen","phone":"0400 000 000","note":"hi"}'
# -> 400 VALIDATION_ERROR, details: note is an unknown field
```
