// Builds the link used for "Share to WhatsApp" buttons.
//
// This intentionally points at the Laravel-rendered /share/{slug} page
// (see backend's ShareController + resources/views/share.blade.php), not the
// SPA's own /i/{slug} route. WhatsApp's link-preview crawler doesn't execute
// JavaScript, so a raw SPA URL previews with nothing but index.html's generic
// title/description. The /share page serves static Open Graph tags for the
// crawler and redirects a real visitor straight through to the SPA.

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

export function shareUrl(slug) {
  return `${API_BASE}/share/${slug}`;
}

export function whatsappShareUrl(slug, message) {
  const text = message ? `${message} ${shareUrl(slug)}` : shareUrl(slug);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
