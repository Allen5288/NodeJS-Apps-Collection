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
| GET | /bookings?date=2026-11-26 | List bookings, optionally for a day 🔑|
| DELETE | /bookings/:id | Cancel a booking, frees the slot 🔑|

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
4. **Auth + tests (done 2026-11-28):** API-key auth for the business side (bookings list,
   cancel) instead of the JWT in the plan — one salon, one key, no token machinery; public read for slots and public booking unchanged. `node --test` coverage of auth and the
   double-booking guard and validation (12 tests).
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

## Auth + tests (day 4)

Days 1–3 built the booking flow, persistence, and validation — all
of it open to anyone who could reach the server. Today the business
side gets a lock, and the whole flow gets tests that prove it still
works.

### Which routes need a key

| Route | Key? | Why |
|---|---|---|
| `GET /health`, `GET /services`, `GET /slots` | No — public | A customer cannot be expected to hold a key to see free slots. |
| `POST /bookings` | No — public | Booking is the customer's job; validation (day 3) is the guard. |
| `GET /bookings`, `DELETE /bookings/:id` | Yes — `x-api-key` | The salon's day sheet and the cancel button belong to the business, not to anyone on the internet. |

The key is one shared key per clinic, from the `BOOKING_API_KEY`
env var — never from code or the booking file. Send it as the
`x-api-key` header:

```bash
BOOKING_API_KEY=salon-secret-key-2026 node src/server.js
curl localhost:3000/bookings -H "x-api-key: salon-secret-key-2026"
```

### Why an API key, not JWT

The build plan said JWT. One salon with one key does not need token
issuance, expiry, refresh, or a login endpoint — a shared key the
owner rotates by changing one env var is the whole mechanism. If
the salon grows to several staff with different permissions, that
is the point to revisit JWT. The key is compared in constant time
(SHA-256 both sides, then `timingSafeEqual`), so a wrong key takes
the same time whatever it is — no timing oracle for guessing the
key a byte at a time. A failed check answers `401 UNAUTHORIZED`
in the same public error shape as everything else (code, message,
correlationId), and says nothing about whether the key was missing,
wrong, or malformed.

No key configured means local-dev mode: the server logs a loud
warning at startup (`API key auth: OFF …`) and lets requests
through, so `node src/server.js` still works on a laptop with no
setup. Set `BOOKING_API_KEY` before exposing the server anywhere
else.

### Tests — `npm test`

`node --test` (Node's built-in runner, no dependencies), in `test/`:

- `test/auth.test.js` — missing key 401, wrong key 401, right key
  200, delete without a key 401 with the booking still booked,
  delete with the key cancels, unknown id 404, public routes
  still work with no key.
- `test/booking-flow.test.js` — create 201 and the slot disappears
  from the free list, double-book 409 `SLOT_TAKEN`, bad phone and
  past date and unknown field all 400 with a `details` entry,
  cancel frees the slot and it can be booked again, the day list
  shows only that date's bookings.

To make the server testable, `server.js` now exports
`createServer()` and only listens when run directly — importing
the module builds the server without starting it, so tests listen
on an ephemeral port. Tests set `BOOKING_API_KEY` before importing
and use future dates (2027-01-15/16, 2027-02-10): the past-date
check uses the server's local date, so a past date would fail
validation before auth is ever reached. Each test file deletes
`data/bookings.json` before and after itself, so a leftover file
from an interrupted run cannot change the answers — and the file
is test data, never committed.

### Try it

```bash
BOOKING_API_KEY=salon-secret-key-2026 node src/server.js
curl localhost:3000/bookings
# -> 401 UNAUTHORIZED (no key)
curl localhost:3000/bookings -H "x-api-key: salon-secret-key-2026"
# -> 200, the day sheet
curl -X POST localhost:3000/bookings -H "Content-Type: application/json" \
  -d '{"serviceId":"haircut","date":"2027-01-15","time":"10:00","customerName":"Alex Chen","phone":"0400 000 000"}'
# -> 201, no key needed — booking stays public
npm test   # 12 tests, 0 failures
```

### Build plan update

4. **Auth + tests (done 2026-11-28):** API-key auth for the
   business side (bookings list, cancel) instead of the JWT in the
   plan — one salon, one key, no token machinery; public read for
   slots and public booking unchanged. `node --test` coverage of
   auth and the double-booking guard and validation (12 tests).
