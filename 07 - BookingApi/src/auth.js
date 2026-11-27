// auth.js — API-key auth for BookingApi.
//
// Day 4. The business side of the API (list bookings, cancel a
// booking) needs to know the caller is the salon, not a stranger
// on the internet. The customer side (services, slots, booking)
// stays public — a customer cannot be expected to hold a key.
//
// Why an API key, not JWT: the README build plan said JWT, but one
// salon with one key does not need token issuance, expiry, refresh
// or a login endpoint. A single shared key per clinic, sent as the
// `x-api-key` header and read from the `BOOKING_API_KEY` env var,
// is the whole mechanism — and it is one the owner can rotate by
// changing one env var. If the salon grows to several staff with
// different permissions, that is the point to revisit JWT (see 14
// in the FastAPI guide for the shape of it).
//
// Rules:
// - The key comes from the environment, never from code or the
//   booking file. A key in the repo is a key everyone has.
// - Comparison is constant-time (SHA-256 both sides, then
//   timingSafeEqual), so a wrong key takes the same time whatever
//   it is — no timing oracle for guessing the key one byte at a time.
// - A failed check answers with the same public error shape as the
//   rest of the API (code, message, correlationId) — and says
//   nothing about whether the key was missing, wrong, or malformed.
// - No key configured means local-dev mode: the server logs a loud
//   warning at startup and lets requests through, so `node
//   src/server.js` still works on a laptop with no setup. Set
//   BOOKING_API_KEY before exposing the server anywhere else.

import { createHash, timingSafeEqual } from "node:crypto";

const HEADER = "x-api-key";

export function getConfiguredApiKey() {
  const raw = process.env.BOOKING_API_KEY;
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  return key.length > 0 ? key : null;
}

export function isAuthConfigured() {
  return getConfiguredApiKey() !== null;
}

export function authStatusLine() {
  return isAuthConfigured()
    ? "API key auth: enforced (BOOKING_API_KEY is set)"
    : "API key auth: OFF — BOOKING_API_KEY is not set (dev only; set it before exposing this server)";
}

function hash(value) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function apiKeyMatches(candidate, expected) {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  // Compare hashes, not the keys: the digests are always the same
  // length, so timingSafeEqual runs in the same time for any wrong
  // key, and the real key never sits in a comparison the caller
  // can time.
  return timingSafeEqual(hash(candidate), hash(expected));
}

export function readApiKey(req) {
  const value = req.headers[HEADER];
  return typeof value === "string" ? value : null;
}

// Check one request. Returns { ok: true } when it may proceed, or
// { ok: false, status, code, message } for the server to answer
// with — the shape is decided here, the sending stays in server.js
// so every error still goes through the one error() helper.
export function checkApiKey(req) {
  const expected = getConfiguredApiKey();
  if (expected === null) return { ok: true, enforced: false };
  if (apiKeyMatches(readApiKey(req), expected)) {
    return { ok: true, enforced: true };
  }
  return {
    ok: false,
    status: 401,
    code: "UNAUTHORIZED",
    message: "a valid api key is required",
  };
}
