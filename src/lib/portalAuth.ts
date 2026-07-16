const PORTAL_TOKEN_KEY = "portal_access_token";
const PORTAL_RESET_PASSWORD_KEY = "portal_reset_password";

export function getPortalAccessToken() {
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function setPortalAccessToken(token: string) {
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
}

export function clearPortalAccessToken() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_RESET_PASSWORD_KEY);
}

export function isPortalAuthenticated() {
  return Boolean(getPortalAccessToken());
}

export function setPortalPasswordResetRequired(required: boolean) {
  localStorage.setItem(PORTAL_RESET_PASSWORD_KEY, String(required));
}

export function clearPortalPasswordResetRequired() {
  localStorage.setItem(PORTAL_RESET_PASSWORD_KEY, "false");
}

export function isPortalPasswordResetRequired() {
  return localStorage.getItem(PORTAL_RESET_PASSWORD_KEY) === "true";
}
