// Thin wrapper around the Laravel API (small, commented, no over-abstraction).
//
// Two kinds of calls:
//   - Public: reading/writing one invitation by slug. No auth needed.
//   - Admin: authenticated via a Sanctum personal access token (Bearer
//     header), not cookie-session auth. The frontend (Vercel) and backend
//     (Railway) live on unrelated domains, and browsers increasingly block
//     cross-site cookies even with SameSite=None — a token in localStorage,
//     sent as `Authorization: Bearer <token>`, sidesteps that entirely.

// The one place the backend's address is decided (share.js imports it too).
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8001').replace(/\/$/, '');

const TOKEN_KEY = 'admin_token';

// Fired when an authenticated request comes back 401 (expired or revoked
// token) — AdminAuthContext listens and sends the user back to the login
// screen instead of leaving them clicking buttons that silently fail.
export const UNAUTHORIZED_EVENT = 'admin:unauthorized';

// Must stay in line with UploadController's server-side limits.
export const UPLOAD_LIMITS_MB = { image: 8, audio: 15 };

export function getAdminToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode) — the session just won't persist.
  }
}

// Human-readable message for any error thrown by this module: the first
// Laravel validation message if there is one, else the API's message.
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const firstValidation = err?.errors && Object.values(err.errors).flat()[0];
  if (firstValidation) return firstValidation;
  if (err?.status === 429) return 'Too many attempts — please wait a minute and try again.';
  if (err?.status === 413) return 'That file is too large for the server to accept.';
  if (err?.status === 403) return "You don't have permission to do that.";
  return err?.message || fallback;
}

async function toError(res, fallback) {
  const payload = await res.json().catch(() => null);
  const error = new Error(payload?.message || fallback || `Request failed (${res.status})`);
  error.status = res.status;
  error.errors = payload?.errors;
  return error;
}

function authHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized(res, auth) {
  if (auth && res.status === 401) {
    setAdminToken(null);
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { Accept: 'application/json', ...(auth ? authHeaders() : {}) };
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error('Could not reach the server. Check your connection and try again.');
    error.status = 0;
    throw error;
  }

  if (!res.ok) {
    handleUnauthorized(res, auth);
    throw await toError(res);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------- Public (per-invitation) ------------------------------------------

export async function getInvitationConfig(slug) {
  const { data } = await request(`/api/invitations/${encodeURIComponent(slug)}`);
  return data;
}

// Returns App\Support\EventTypes::ALL — every event type's modules, roles,
// default theme, story layouts, and copy strings, so the admin never has to
// hand-duplicate that list. Not per-invitation, so no slug in the path.
export function getEventTypes() {
  return request('/api/event-types');
}

// Returns { id, edit_token }. Pass both back (payload.rsvp_id /
// payload.edit_token) to change that same response later.
export function submitRsvp(slug, payload) {
  return request(`/api/invitations/${encodeURIComponent(slug)}/rsvp`, { method: 'POST', body: payload });
}

// Newest first, one page at a time; `before` is the id of the oldest wish
// already shown ("Load more").
export function getWishes(slug, before) {
  const query = before ? `?before=${before}` : '';
  return request(`/api/invitations/${encodeURIComponent(slug)}/wishes${query}`);
}

export function postWish(slug, payload) {
  return request(`/api/invitations/${encodeURIComponent(slug)}/wishes`, { method: 'POST', body: payload });
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

// `params` may include `type`, `status` ('published'|'draft'), `search`,
// `page`, `per_page` — all optional, all forwarded as query params. Returns
// the full Laravel paginator payload ({ data, meta, links }) so the caller
// can drive pagination controls off `meta`.
export async function adminListInvitations(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return request(`/api/admin/invitations${query ? `?${query}` : ''}`, { auth: true });
}

export function adminGetDashboardStats() {
  return request('/api/admin/invitations/stats', { auth: true });
}

// ---------- Client accounts (admin-only) --------------------------------------

export async function adminListClients() {
  const { data } = await request('/api/admin/clients', { auth: true });
  return data;
}

export function adminCreateClient(payload) {
  return request('/api/admin/clients', { method: 'POST', body: payload, auth: true });
}

// Rename or reset password (a reset also signs the client out everywhere).
export function adminUpdateClient(clientId, payload) {
  return request(`/api/admin/clients/${clientId}`, { method: 'PUT', body: payload, auth: true });
}

export function adminDeleteClient(clientId) {
  return request(`/api/admin/clients/${clientId}`, { method: 'DELETE', auth: true });
}

// ---------- Invitations + nested content --------------------------------------

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

// The public page's config for an invitation the admin/owner can see,
// published or not — what /admin/preview/:id renders. The public endpoint
// 404s on drafts by design, so previewing one has to go through here.
export async function adminPreviewConfig(id) {
  const { data } = await request(`/api/admin/invitations/${id}/preview`, { auth: true });
  return data;
}

export function adminDeleteInvitation(id) {
  return request(`/api/admin/invitations/${id}`, { method: 'DELETE', auth: true });
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

export function adminReorderGalleryImages(invitationId, orderedIds) {
  return request(`/api/admin/invitations/${invitationId}/gallery-images/reorder`, { method: 'PUT', body: { ordered_ids: orderedIds }, auth: true });
}

// Returns { path, url }: `path` is what gets saved on the invitation,
// `url` is the browser-reachable address for an immediate preview.
export async function adminUploadFile(invitationId, file, kind = 'image') {
  const limitMb = UPLOAD_LIMITS_MB[kind];
  if (limitMb && file.size > limitMb * 1024 * 1024) {
    const error = new Error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${limitMb} MB.`);
    error.status = 413;
    throw error;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', kind);

  let res;
  try {
    res = await fetch(`${API_BASE}/api/admin/invitations/${invitationId}/upload`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...authHeaders() },
      body: formData,
    });
  } catch {
    const error = new Error('Upload failed — could not reach the server.');
    error.status = 0;
    throw error;
  }

  if (!res.ok) {
    handleUnauthorized(res, true);
    throw await toError(res, 'Upload failed');
  }
  return res.json();
}

// Back-compat alias — several admin tabs call this name for photo uploads.
export function adminUploadImage(invitationId, file) {
  return adminUploadFile(invitationId, file, 'image');
}

export function adminListRsvps(invitationId) {
  return request(`/api/admin/invitations/${invitationId}/rsvps`, { auth: true });
}

export function adminDeleteRsvp(invitationId, rsvpId) {
  return request(`/api/admin/invitations/${invitationId}/rsvps/${rsvpId}`, { method: 'DELETE', auth: true });
}

// A plain <a href> can't carry an Authorization header, so the export is
// fetched here (with the Bearer token) and handed to the browser as a blob
// download instead of a direct link.
export async function adminExportRsvps(invitationId) {
  const res = await fetch(`${API_BASE}/api/admin/invitations/${invitationId}/rsvps/export`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    handleUnauthorized(res, true);
    throw await toError(res, 'Export failed');
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] || 'rsvps.csv';

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking synchronously can cancel the download in Firefox/Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function adminListWishes(invitationId) {
  return request(`/api/admin/invitations/${invitationId}/wishes`, { auth: true });
}

export function adminDeleteWish(invitationId, wishId) {
  return request(`/api/admin/invitations/${invitationId}/wishes/${wishId}`, { method: 'DELETE', auth: true });
}
