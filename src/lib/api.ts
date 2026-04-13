/// <reference types="vite/client" />
import axios from "axios";
import { clearPortalAccessToken, getPortalAccessToken } from "./portalAuth";
import type { InquirySubmissionResponse, Order, PortalSummary, Product } from "../types/domain";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env");
}

export const API_BASE_URL = apiBaseUrl;

const portalApiClient = axios.create({
  baseURL: API_BASE_URL
});

portalApiClient.interceptors.request.use((config) => {
  const token = getPortalAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearPortalAccessToken();
    }
    return Promise.reject(error);
  }
);

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

export async function submitInvestorInquiryApi(
  payload: {
    fullName: string;
    fatherName: string;
    mobileNumber: string;
    email: string;
    aadhaarNumber: string;
    panNumber: string;
    fullAddress: string;
    investmentAmount: number;
    investmentDate: string;
    preferredPaymentMode?: string;
    transactionId?: string;
    paymentDate?: string;
    notes?: string;
    termsAccepted: boolean;
  },
  files: {
    idProof?: File | null;
    paymentScreenshot?: File | null;
  }
) {
  const formData = new FormData();
  formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (files.idProof) {
    formData.append("idProof", files.idProof);
  }
  if (files.paymentScreenshot) {
    formData.append("paymentScreenshot", files.paymentScreenshot);
  }

  const response = await axios.post<InquirySubmissionResponse>(`${API_BASE_URL}/inquiries/investor`, formData);
  return response.data;
}

export async function submitFarmerInquiryApi(
  payload: {
    fullName: string;
    fatherName: string;
    mobileNumber: string;
    alternateNumber?: string;
    email: string;
    aadhaarNumber: string;
    address: string;
    village: string;
    district: string;
    state: string;
    pinCode: string;
    farmingType: string;
    landArea: string;
    mainCrops: string;
    irrigationType: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    notes?: string;
    termsAccepted: boolean;
  },
  files: {
    aadhaarDocument: File;
    landProofDocument?: File | null;
    bankPassbookDocument?: File | null;
  }
) {
  const formData = new FormData();
  formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  formData.append("aadhaarDocument", files.aadhaarDocument);
  if (files.landProofDocument) {
    formData.append("landProofDocument", files.landProofDocument);
  }
  if (files.bankPassbookDocument) {
    formData.append("bankPassbookDocument", files.bankPassbookDocument);
  }

  const response = await axios.post<InquirySubmissionResponse>(`${API_BASE_URL}/inquiries/farmer`, formData);
  return response.data;
}

export async function submitCollectionHubInquiryApi(
  payload: {
    fullName: string;
    fatherName: string;
    mobileNumber: string;
    alternateNumber?: string;
    email: string;
    aadhaarNumber: string;
    address: string;
    village: string;
    district: string;
    state: string;
    pinCode: string;
    collectionHubName: string;
    storageType: string;
    capacityMt: number;
    pickupRadiusKm: number;
    operatingDays: string;
    notes?: string;
    termsAccepted: boolean;
  },
  files: {
    hubDocument?: File | null;
  }
) {
  const formData = new FormData();
  formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (files.hubDocument) {
    formData.append("hubDocument", files.hubDocument);
  }

  const response = await axios.post<InquirySubmissionResponse>(`${API_BASE_URL}/inquiries/collection-hub`, formData);
  return response.data;
}

export async function requestPortalOtpApi(payload: { identifier: string }) {
  const response = await axios.post<{ message: string; expiresInSeconds: number; devOtp: string | null }>(
    `${API_BASE_URL}/portal/auth/request-otp`,
    payload
  );
  return response.data;
}

export async function verifyPortalOtpApi(payload: { identifier: string; otp: string }) {
  const response = await axios.post<{
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    role: string;
  }>(`${API_BASE_URL}/portal/auth/verify-otp`, payload);
  return response.data;
}

export async function fetchPortalSummaryApi() {
  const response = await portalApiClient.get<PortalSummary>("/portal/summary");
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
