# 2.14 Never leak internals in error responses

## The rule

An error response is a public contract, not a debug dump. Return a stable, minimal shape — an error code, a short human-readable message, and a correlation id — and never include stack traces, SQL, file paths, or library internals. Log the full error server-side against the same correlation id.

## One error shape for the whole API

```js
// AppError carries a public code + HTTP status; the message is safe to show
class AppError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code; // e.g. 'USER_NOT_FOUND' — stable, documented
    this.status = status; // e.g. 404
    this.isOperational = true;
  }
}

// Central error handler (see 2.4): log everything, send back almost nothing
app.use((err, req, res, next) => {
  const correlationId = req.id; // set by request-id middleware, returned in a header
  logger.error({ err, correlationId, path: req.path }); // full detail stays server-side
  const status = err.isOperational ? err.status : 500;
  const code = err.isOperational ? err.code : 'INTERNAL_ERROR';
  const message = err.isOperational ? err.message : 'Something went wrong';
  res.status(status).json({ error: { code, message, correlationId } });
});
```

## Rules that follow from this

- **Operational errors** (see 2.3) get their documented code and message; **programmer errors** always become `INTERNAL_ERROR` with a generic message — the client learns nothing about what broke, and the correlation id lets support find the log line.
- **Never interpolate user input into the public message.** `"User ${email} not found"` leaks whether an account exists; prefer `"Invalid credentials"` for auth and `"Resource not found"` for lookups.
- **Document the codes** (see 2.5): if a code is not in the OpenAPI error list, it does not ship.
- **Same shape everywhere** — REST, GraphQL errors array, and WebSocket error frames all carry `{ code, message, correlationId }`, so one client handler covers every entry point.
- **Return the correlation id in a header too** (`X-Correlation-Id`), so a client that only sees a failed request in its own logs can still quote the id to support.

## What not to do

```js
// ❌ Never do this — stack traces and internals go to the client
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});
```

## Added

2026-11-21 — new practice 2.14, extending the error-handling chapter (2.1–2.13).
