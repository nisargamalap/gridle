export const respond = {
  ok(data, init) {
    return Response.json({ ok: true, data }, { status: 200, ...(init || {}) });
  },
  created(data, init) {
    return Response.json({ ok: true, data }, { status: 201, ...(init || {}) });
  },
  bad(message = "Bad request", details) {
    return Response.json({ ok: false, error: { message, details } }, { status: 400 });
  },
  unauthorized(message = "Unauthorized") {
    return Response.json({ ok: false, error: { message } }, { status: 401 });
  },
  forbidden(message = "Forbidden") {
    return Response.json({ ok: false, error: { message } }, { status: 403 });
  },
  notFound(message = "Not found") {
    return Response.json({ ok: false, error: { message } }, { status: 404 });
  },
  tooMany(message = "Too many requests") {
    return Response.json({ ok: false, error: { message } }, { status: 429 });
  },
  error(err, fallback = "Internal server error") {
    const message = typeof err === "string" ? err : err?.message || fallback;
    return Response.json({ ok: false, error: { message } }, { status: 500 });
  }
};
