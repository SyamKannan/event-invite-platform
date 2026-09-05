// Thin wrapper around the Laravel API — mirrors the style of lib/supabase.js
// (small, commented, no over-abstraction).
//
// Two kinds of calls:
//   - Public: reading/writing one invitation by slug. No auth needed.
//   - Admin: authenticated via Laravel Sanctum's SPA cookie flow. Before any
//     admin POST/PUT/DELETE, the browser must hold a CSRF cookie (fetched
//     once via ensureCsrfCookie()) which we echo back as the X-XSRF-TOKEN
//     header — Sanctum/Laravel matches the two to prove the request came
//     from our own frontend, not a forged cross-site request.

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfCookie() {
  if (readCookie('XSRF-TOKEN')) return;
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' });
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';

  if (auth && method !== 'GET') {
    await ensureCsrfCookie();
    headers['X-XSRF-TOKEN'] = readCookie('XSRF-TOKEN');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: auth ? 'include' : 'same-origin',
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

export async function adminLogin(email, password) {
  await ensureCsrfCookie();
  return request('/api/admin/login', { method: 'POST', body: { email, password }, auth: true });
}

export function adminLogout() {
  return request('/api/admin/logout', { method: 'POST', auth: true });
}

export function adminMe() {
  return request('/api/admin/me', { auth: true });
}

export async function adminListInvitations() {
  const { data } = await request('/api/admin/invitations', { auth: true });
  return data;
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
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', kind);

  const res = await fetch(`${API_BASE}/api/admin/invitations/${invitationId}/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
    },
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
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

export function adminExportRsvpsUrl(invitationId) {
  return `${API_BASE}/api/admin/invitations/${invitationId}/rsvps/export`;
}

export function adminListWishes(invitationId) {
  return request(`/api/admin/invitations/${invitationId}/wishes`, { auth: true });
}

export function adminDeleteWish(invitationId, wishId) {
  return request(`/api/admin/invitations/${invitationId}/wishes/${wishId}`, { method: 'DELETE', auth: true });
}
