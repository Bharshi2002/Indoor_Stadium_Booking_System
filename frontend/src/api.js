// src/api.js
// ── Central API service — all calls go through here ─────────────────────────

const BASE = "http://127.0.0.1:8000/api";

async function request(method, path, body = null) {
  const token = localStorage.getItem("token");

  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept":       "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res  = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function apiRegister(payload) {
  const data = await request("POST", "/register", payload);
  _saveSession(data);
  return data;
}

export async function apiLogin(email, password) {
  const data = await request("POST", "/login", { email, password });
  _saveSession(data);
  return data;
}

export async function apiLogout() {
  try { await request("POST", "/logout"); } catch (_) {}
  _clearSession();
}

export async function apiForgotPassword(email) {
  return request("POST", "/forgot-password", { email });
}

export async function apiResetPassword(email, token, password, password_confirmation) {
  return request("POST", "/reset-password", { email, token, password, password_confirmation });
}
export function getFacilities() {
  return request("GET", "/facilities");
}

// Admin version — returns ALL including inactive
export function adminGetAllFacilities() {
  return request("GET", "/admin/facilities");
}

// Admin — get who booked a specific slot
export function adminGetSlotInfo(facilityId, date, session, slot) {
  const qs = new URLSearchParams({ facility_id: facilityId, date, session, slot }).toString();
  return request("GET", `/admin/slot-info?${qs}`);
}

export function getBookedSlots(facilityId, date, session) {
  return request("GET", `/facilities/${facilityId}/slots?date=${date}&session=${session}`);
}

// ── Slot Locking ──────────────────────────────────────────────────────────────
export function lockSlots(payload) {
  return request("POST", "/slots/lock", payload);
}

export function unlockSlots() {
  return request("DELETE", "/slots/lock");
}

// ── Bookings (user) ───────────────────────────────────────────────────────────
export function getMyBookings() {
  return request("GET", "/bookings");
}

export function createBooking(payload) {
  return request("POST", "/bookings", payload);
}

// ── Facility Blocks (admin) ───────────────────────────────────────────────────
export function adminGetFacilityBlocks() {
  return request("GET", "/admin/facility-blocks");
}
export function adminAddFacilityBlock(payload) {
  return request("POST", "/admin/facility-blocks", payload);
}
export function adminDeleteFacilityBlock(id) {
  return request("DELETE", `/admin/facility-blocks/${id}`);
}

// ── Holidays ──────────────────────────────────────────────────────────────────
export function getHolidays(year) {
  return request("GET", `/holidays?year=${year}`);
}

export function adminGetHolidays() {
  return request("GET", "/admin/holidays");
}

export function adminGenerateHolidays(year) {
  return request("POST", `/admin/holidays/generate/${year}`);
}

export function adminAddHoliday(date, name) {
  return request("POST", "/admin/holidays", { date, name });
}

export function adminDeleteHoliday(id) {
  return request("DELETE", `/admin/holidays/${id}`);
}
export function adminStats(period = 'all') {
  return request("GET", `/admin/stats?period=${period}`);
}

export function adminAllBookings(filters = {}) {
  const qs = new URLSearchParams(filters).toString();
  return request("GET", `/admin/bookings${qs ? "?" + qs : ""}`);
}

export function adminCancelBooking(id) {
  return request("DELETE", `/admin/bookings/${id}`);
}

export function adminAllUsers() {
  return request("GET", "/admin/users");
}

export function adminDeleteUser(id) {
  return request("DELETE", `/admin/users/${id}`);
}

export function adminChangeRole(id, role) {
  return request("PATCH", `/admin/users/${id}/role`, { role });
}

export function adminCreateFacility(payload) {
  return request("POST", "/admin/facilities", payload);
}

export function adminUpdateFacility(id, payload) {
  return request("PUT", `/admin/facilities/${id}`, payload);
}

export function adminToggleFacility(id) {
  return request("PATCH", `/admin/facilities/${id}/toggle`);
}

export function adminDeleteFacility(id) {
  return request("DELETE", `/admin/facilities/${id}`);
}

// ── Session helpers ───────────────────────────────────────────────────────────
function _saveSession(data) {
  localStorage.setItem("token",      data.token);
  localStorage.setItem("username",   data.user.username);
  localStorage.setItem("role",       data.user.role);
  localStorage.setItem("isLoggedIn", "true");
}

function _clearSession() {
  ["token", "username", "role", "isLoggedIn"].forEach((k) =>
    localStorage.removeItem(k)
  );
}

export const isLoggedIn = () => localStorage.getItem("isLoggedIn") === "true";
export const getRole    = () => localStorage.getItem("role") || "user";
export const getUsername = () => localStorage.getItem("username") || "";