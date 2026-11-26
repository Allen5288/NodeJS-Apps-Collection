// validate.js — request validation for BookingApi.
//
// Day 1 and 2 validated inline in server.js, a few `if`s per
// route. That works for one route and rots for five: the same
// date check copied into every handler, each copy slightly
// different. This module is the boundary — every booking request
// passes through it, and the handler only sees a clean value or a
// list of field errors.
//
// Shape: validateBooking(body, services, slotTimes) returns
//   { ok: true, value }            — value is the cleaned booking fields
//   { ok: false, errors: [...] }   — one { field, issue } per bad field
// The server turns `errors` into the one public error shape
// (code VALIDATION_ERROR + details array) from the 2.14 safe-error
// practice. No internals leak: the messages name the field and the
// rule, never a stack trace or a file path.
//
// Rules, and why each one exists:
// - Unknown fields are rejected, not dropped. A client sending
//   `emai` instead of `email` should get a 400, not a booking with
//   no contact — the same rule as the AWS Register API (2026-11-23).
// - date must be a real calendar date (2026-02-30 is not a date)
//   and not in the past. A booking for yesterday is a data error
//   the business finds out about at the door.
// - phone is optional, but if present it must be an Australian
//   number (mobile 04XX or landline 02/03/07/08, with or without
//   +61). The salon calls the customer back; a wrong number is a
//   no-show nobody can prevent. Stored normalised (digits only,
//   +61 kept), so "0400 000 000" and "0400000000" are the same.
// - customerName is trimmed and capped at 100 chars; a 5,000-char
//   name is a cheap denial of service on the JSON file store.

const ALLOWED_FIELDS = new Set([
  "serviceId",
  "date",
  "time",
  "customerName",
  "phone",
]);

const PHONE_RE = /^(\+61|0)[2-478]\d{8}$/;

function normalisePhone(raw) {
  return raw.replace(/[\s\-()]/g, "");
}

function isRealDate(dateStr) {
  // YYYY-MM-DD shape first, then a real calendar date: parsing
  // "2026-02-30" with Date rolls it over to 2026-03-02, so compare
  // the round-trip to catch the rollover.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  return (
    !Number.isNaN(d.getTime()) &&
    d.toISOString().slice(0, 10) === dateStr
  );
}

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function validateBooking(body, services, slotTimes) {
  const errors = [];
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      errors: [{ field: "body", issue: "request body must be a JSON object" }],
    };
  }
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      errors.push({ field: key, issue: "unknown field" });
    }
  }

  const { serviceId, date, time, customerName, phone } = body;

  if (!services.some((s) => s.id === serviceId)) {
    errors.push({ field: "serviceId", issue: "unknown serviceId" });
  }
  if (typeof date !== "string" || !isRealDate(date)) {
    errors.push({
      field: "date",
      issue: "date must be a real calendar date, YYYY-MM-DD",
    });
  } else if (date < todayStr()) {
    errors.push({ field: "date", issue: "date must not be in the past" });
  }
  if (!slotTimes.includes(time)) {
    errors.push({ field: "time", issue: "time must be a listed slot" });
  }
  if (typeof customerName !== "string" || customerName.trim().length < 2) {
    errors.push({
      field: "customerName",
      issue: "customerName is required (at least 2 characters)",
    });
  } else if (customerName.trim().length > 100) {
    errors.push({
      field: "customerName",
      issue: "customerName must be at most 100 characters",
    });
  }
  let normalisedPhone = null;
  if (phone !== undefined && phone !== null && phone !== "") {
    if (typeof phone !== "string" || !PHONE_RE.test(normalisePhone(phone))) {
      errors.push({
        field: "phone",
        issue: "phone must be an Australian number, e.g. 0400 000 000",
      });
    } else {
      normalisedPhone = normalisePhone(phone);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      serviceId,
      date,
      time,
      customerName: customerName.trim(),
      phone: normalisedPhone,
    },
  };
}
