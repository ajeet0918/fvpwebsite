/// <reference types="vite/client" />
import axios from "axios";
import type { Order, Product } from "../types/domain";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env");
}

export const API_BASE_URL = apiBaseUrl;

export async function fetchProductsApi() {
  const response = await axios.get<Product[]>(`${API_BASE_URL}/products`);
  return response.data;
}

export async function createOrderApi(payload: object) {
  const response = await axios.post<Order>(`${API_BASE_URL}/orders`, payload);
  return response.data;
}

export async function trackOrderApi(orderNumber: string) {
  const response = await axios.get<Order>(
    `${API_BASE_URL}/orders/track/${encodeURIComponent(orderNumber)}`
  );
  return response.data;
}

export async function submitLeadApi(payload: { fullName: string; email: string; phone: string }) {
  const response = await axios.post(`${API_BASE_URL}/leads`, payload);
  return response.data;
}

export function readErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      (typeof error.response?.data?.message === "string" && error.response.data.message) ||
      error.message ||
      fallback
    );
  }

  return fallback;
}
