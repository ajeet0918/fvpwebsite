const CUSTOMER_TOKEN_KEY = "customer_access_token";

export function getCustomerAccessToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerAccessToken(token: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function clearCustomerAccessToken() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export function isCustomerAuthenticated() {
  return Boolean(getCustomerAccessToken());
}
