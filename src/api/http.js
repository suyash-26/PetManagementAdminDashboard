// Thin fetch wrapper for the two backends — same shape as the user dashboard's, so the
// two apps stay easy to diff.
//
// Error contract: throw a plain Error with a human-readable .message, so every page can
// use `catch (err) { setError(err.message) }`.

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8080";
const CORE_BASE_URL = import.meta.env.VITE_CORE_API_URL ?? "http://localhost:8081";

// Deliberately NOT the user dashboard's "petmgmt_auth_token". Both apps run on
// localhost and localStorage is shared per-origin-per-port — but during development
// people proxy them together often enough that a distinct key avoids one app silently
// adopting the other's session (and an admin ending up logged in as a plain USER).
const TOKEN_KEY = "petmgmt_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(baseUrl, path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network failure (backend down, CORS rejection, DNS). fetch throws a bare TypeError
    // with nothing useful in it, so replace the message with something actionable.
    throw new Error(`Could not reach the server at ${baseUrl}. Is it running?`);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new Error(errorMessage(data, response.status));
  }

  return data;
}

// Core's GlobalExceptionHandler returns ApiError {timestamp, status, message, fieldErrors}
// where `message` is a stable code like CENTER_ALREADY_EXISTS and `fieldErrors` is a
// per-field map on validation failures. Spring's own default body uses {error, message}.
// Handle all three so a page never surfaces "[object Object]".
function errorMessage(data, status) {
  if (!data) return `Request failed (${status})`;
  if (typeof data === "string") return data;

  if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.entries(data.fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(", ");
  }

  return humanizeCode(data.message) || data.error || `Request failed (${status})`;
}

// CENTER_ALREADY_EXISTS -> "Center already exists". The backend's codes are meant to be
// machine-readable; this keeps them from being shouted at the user verbatim.
function humanizeCode(message) {
  if (!message) return null;
  if (!/^[A-Z0-9_]+$/.test(message)) return message;
  const words = message.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function authRequest(path, options) {
  return request(AUTH_BASE_URL, path, options);
}

export function coreRequest(path, options) {
  return request(CORE_BASE_URL, path, options);
}
