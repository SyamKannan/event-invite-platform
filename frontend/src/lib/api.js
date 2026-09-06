// Thin wrapper around the Laravel API — mirrors the style of lib/supabase.js
// (small, commented, no over-abstraction).
//
// Two kinds of calls:
//   - Public: reading/writing one invitation by slug. No auth needed.
//   - Admin: authenticated via a Sanctum personal access token (Bearer
//     header), not cookie-session auth. The frontend (Vercel) and backend
//     (Railway) live on unrelated domains, and browsers increasingly block
//     cross-site cookies even with SameSite=None — a token in localStorage,
//     sent as `Authorization: Bearer <token>`, sidesteps that entirely.

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const TOKEN_KEY = 'admin_token';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const error = new Error(payload?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.errors = payload?.errors;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------- Public (per-invitation) ------------------------------------------

export async function getInvitationConfig(slug) {
  const { data } = await request(`/api/invitations/${slug}`);
  return data;
}

export function submitRsvp(slug, payload) {
  return request(`/api/invitations/${slug}/rsvp`, { method: 'POST', body: payload });
}

export function getWishes(slug) {
  return request(`/api/invitations/${slug}/wishes`);
}

export function postWish(slug, payload) {
  return request(`/api/invitations/${slug}/wishes`, { method: 'POST', body: payload });
}

// ---------- Admin (Sanctum-authenticated) ------------------------------------

export async function adminLogin(username, password) {
  const { user, token } = await request('/api/admin/login', { method: 'POST', body: { username, password } });
  setAdminToken(token);
  return user;
}

export async function adminLogout() {
  try {
    await request('/api/admin/logout', { method: 'POST', auth: true });
  } finally {
    setAdminToken(null);
  }
}

export function adminMe() {
  return request('/api/admin/me', { auth: true });
}

export async function adminListInvitations() {
  const { data } = await request('/api/admin/invitations', { auth: true });
  return data;
}

// ---------- Client accounts (admin-only: who a given invitation belongs to) --

export async function adminListClients() {
  const { data } = await request('/api/admin/clients', { auth: true });
  return data;
}

export function adminCreateClient(payload) {
  return request('/api/admin/clients', { method: 'POST', body: payload, auth: true });
}

export async function adminCreateInvitation(payload) {
  const { data } = await request('/api/admin/invitations', { method: 'POST', body: payload, auth: true });
  return data;
}

export async function adminGetInvitation(id) {
  const { data } = await request(`/api/admin/invitations/${id}`, { auth: true });
  return data;
}

export async function adminUpdateInvitation(id, payload) {
  const { data } = await request(`/api/admin/invitations/${id}`, { method: 'PUT', body: payload, auth: true });
  return data;
}

export function adminDeleteInvitation(id) {
  return request(`/api/admin/invitations/${id}`, { method: 'DELETE', auth: true });
}

export function adminCreatePerson(invitationId, payload) {
  return request(`/api/admin/invitations/${invitationId}/people`, { method: 'POST', body: payload, auth: true });
}

export function adminUpdatePerson(invitationId, personId, payload) {
  return request(`/api/admin/invitations/${invitationId}/people/${personId}`, { method: 'PUT', body: payload, auth: true });
}

export function adminDeletePerson(invitationId, personId) {
  return request(`/api/admin/invitations/${invitationId}/people/${personId}`, { method: 'DELETE', auth: true });
}

export function adminCreateScheduleEvent(invitationId, payload) {
  return request(`/api/admin/invitations/${invitationId}/schedule-events`, { method: 'POST', body: payload, auth: true });
}

export function adminUpdateScheduleEvent(invitationId, eventId, payload) {
  return request(`/api/admin/invitations/${invitationId}/schedule-events/${eventId}`, { method: 'PUT', body: payload, auth: true });
}

export function adminDeleteScheduleEvent(invitationId, eventId) {
  return request(`/api/admin/invitations/${invitationId}/schedule-events/${eventId}`, { method: 'DELETE', auth: true });
}

export function adminCreateMilestone(invitationId, payload) {
  return request(`/api/admin/invitations/${invitationId}/milestones`, { method: 'POST', body: payload, auth: true });
}

export function adminUpdateMilestone(invitationId, milestoneId, payload) {
  return request(`/api/admin/invitations/${invitationId}/milestones/${milestoneId}`, { method: 'PUT', body: payload, auth: true });
}

export function adminDeleteMilestone(invitationId, milestoneId) {
  return request(`/api/admin/invitations/${invitationId}/milestones/${milestoneId}`, { method: 'DELETE', auth: true });
}

export function adminCreateGalleryImage(invitationId, payload) {
  return request(`/api/admin/invitations/${invitationId}/gallery-images`, { method: 'POST', body: payload, auth: true });
}

export function adminUpdateGalleryImage(invitationId, imageId, payload) {
  return request(`/api/admin/invitations/${invitationId}/gallery-images/${imageId}`, { method: 'PUT', body: payload, auth: true });
}

export function adminDeleteGalleryImage(invitationId, imageId) {
  return request(`/api/admin/invitations/${invitationId}/gallery-images/${imageId}`, { method: 'DELETE', auth: true });
}

export async function adminUploadFile(invitationId, file, kind = 'image') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', kind);

  const res = await fetch(`${API_BASE}/api/admin/invitations/${invitationId}/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const error = new Error(payload?.message || 'Upload failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Back-compat alias — several admin tabs still call this name for photo
// uploads specifically.
export function adminUploadImage(invitationId, file) {
  return adminUploadFile(invitationId, file, 'image');
}

export function adminListRsvps(invitationId) {
  return request(`/api/admin/invitations/${invitationId}/rsvps`, { auth: true });
}

// A plain <a href> can't carry an Authorization header, so the export is
// fetched here (with the Bearer token) and handed to the browser as a blob
// download instead of a direct link.
export async function adminExportRsvps(invitationId) {
  const res = await fetch(`${API_BASE}/api/admin/invitations/${invitationId}/rsvps/export`, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  if (!res.ok) {
    const error = new Error('Export failed');
    error.status = res.status;
    throw error;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rsvps.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function adminListWishes(invitationId) {
  return request(`/api/admin/invitations/${invitationId}/wishes`, { auth: true });
}

export function adminDeleteWish(invitationId, wishId) {
  return request(`/api/admin/invitations/${invitationId}/wishes/${wishId}`, { method: 'DELETE', auth: true });
}
