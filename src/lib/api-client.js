export async function api(path, { method = "GET", body, headers } = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  };

  const res = await fetch(path, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors for empty bodies
  }

  if (!res.ok) {
    const msg = data?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data?.data ?? data;
}
