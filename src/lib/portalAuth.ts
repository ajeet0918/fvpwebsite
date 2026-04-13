const PORTAL_TOKEN_KEY = "portal_access_token";

export function getPortalAccessToken() {
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function setPortalAccessToken(token: string) {
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
}

export function clearPortalAccessToken() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
}

export function isPortalAuthenticated() {
  return Boolean(getPortalAccessToken());
}
