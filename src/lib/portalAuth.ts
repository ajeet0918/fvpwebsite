const PORTAL_TOKEN_KEY = "portal_access_token";
const PORTAL_RESET_PASSWORD_KEY = "portal_reset_password";
const PORTAL_USER_TYPE_KEY = "portal_user_type";
const PORTAL_USERNAME_KEY = "portal_username";

export type PortalUserType = "FARMER" | "INVESTOR" | "COLLECTION_HUB";

export function getPortalAccessToken() {
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function setPortalAccessToken(token: string) {
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
}

export function clearPortalAccessToken() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_RESET_PASSWORD_KEY);
  localStorage.removeItem(PORTAL_USER_TYPE_KEY);
  localStorage.removeItem(PORTAL_USERNAME_KEY);
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

export function setPortalIdentity(username: string, userType: PortalUserType) {
  localStorage.setItem(PORTAL_USERNAME_KEY, username);
  localStorage.setItem(PORTAL_USER_TYPE_KEY, userType);
}

export function getPortalUsername() {
  return localStorage.getItem(PORTAL_USERNAME_KEY) ?? "";
}

export function getPortalUserType(): PortalUserType | null {
  const userType = localStorage.getItem(PORTAL_USER_TYPE_KEY);
  return userType === "FARMER" || userType === "INVESTOR" || userType === "COLLECTION_HUB"
    ? userType
    : null;
}
