/// <reference types="vite/client" />
import axios from "axios";
import { clearCustomerAccessToken, getCustomerAccessToken } from "./customerAuth";
import { clearPortalAccessToken, getPortalAccessToken } from "./portalAuth";
import type {
  CustomerAddress,
  CustomerAuthResponse,
  CustomerProfile,
  CustomerOrder,
  InquirySubmissionResponse,
  Order,
  PortalAuthResponse,
  PortalSummary,
  Product
} from "../types/domain";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env");
}

export const API_BASE_URL = apiBaseUrl;

const customerApiClient = axios.create({
  baseURL: API_BASE_URL
});

const portalApiClient = axios.create({
  baseURL: API_BASE_URL
});

customerApiClient.interceptors.request.use((config) => {
  const token = getCustomerAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearCustomerAccessToken();
    }
    return Promise.reject(error);
  }
);

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

export async function fetchProductBySlugApi(slug: string) {
  const response = await axios.get<Product>(`${API_BASE_URL}/products/${encodeURIComponent(slug)}`);
  return response.data;
}

export async function submitLeadApi(payload: { fullName: string; email: string; phone: string }) {
  const response = await axios.post(`${API_BASE_URL}/leads`, payload);
  return response.data;
}

export async function createOrderApi(payload: object) {
  const response = await axios.post<Order>(`${API_BASE_URL}/orders`, payload);
  return response.data;
}

export async function customerSignupApi(payload: {
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  password: string;
}) {
  const response = await axios.post<CustomerAuthResponse>(`${API_BASE_URL}/customer/auth/signup`, payload);
  return response.data;
}

export async function customerLoginApi(payload: { email: string; password: string }) {
  const response = await axios.post<CustomerAuthResponse>(`${API_BASE_URL}/customer/auth/login`, payload);
  return response.data;
}

export async function customerGoogleAuthApi(idToken: string) {
  const response = await axios.post<CustomerAuthResponse>(`${API_BASE_URL}/customer/auth/google`, { idToken });
  return response.data;
}

export async function portalLoginApi(payload: { username: string; password: string }) {
  const response = await axios.post<PortalAuthResponse>(`${API_BASE_URL}/portal/auth/login`, payload);
  return response.data;
}

export async function activatePortalAccountApi(payload: { token: string; password: string }) {
  const response = await axios.post<{ message: string }>(`${API_BASE_URL}/portal/auth/activate`, payload);
  return response.data;
}

export async function requestPortalPasswordResetApi(payload: { identifier: string }) {
  const response = await axios.post<{ message: string }>(`${API_BASE_URL}/portal/auth/request-password-reset`, payload);
  return response.data;
}

export async function resetPortalPasswordApi(payload: { token: string; password: string }) {
  const response = await axios.post<{ message: string }>(`${API_BASE_URL}/portal/auth/reset-password`, payload);
  return response.data;
}

export async function fetchPortalSummaryApi() {
  const response = await portalApiClient.get<PortalSummary>("/portal/summary");
  return response.data;
}

export async function fetchCustomerProfileApi() {
  const response = await customerApiClient.get<CustomerProfile>("/customer/me");
  return response.data;
}

export async function updateCustomerProfileApi(payload: {
  fullName: string;
  companyName?: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  postalCode: string;
}) {
  const response = await customerApiClient.put<CustomerProfile>("/customer/me/profile", payload);
  return response.data;
}

export async function updateCustomerPaymentPreferenceApi(payload: {
  preferredPaymentMethod?: string;
  preferredPaymentHandle?: string;
}) {
  const response = await customerApiClient.put<CustomerProfile>("/customer/me/payment-preference", payload);
  return response.data;
}

export async function fetchCustomerAddressesApi() {
  const response = await customerApiClient.get<CustomerAddress[]>("/customer/me/addresses");
  return response.data;
}

export async function createCustomerAddressApi(payload: {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}) {
  const response = await customerApiClient.post<CustomerAddress>("/customer/me/addresses", payload);
  return response.data;
}

export async function updateCustomerAddressApi(addressId: number, payload: {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}) {
  const response = await customerApiClient.put<CustomerAddress>(`/customer/me/addresses/${addressId}`, payload);
  return response.data;
}

export async function deleteCustomerAddressApi(addressId: number) {
  await customerApiClient.delete(`/customer/me/addresses/${addressId}`);
}

export async function createDirectOrderApi(payload: {
  addressId?: number;
  customerNotes?: string;
  checkoutSuccessUrl: string;
  checkoutFailureUrl: string;
  items: Array<{
    productSlug: string;
    quantity: number;
    unit: string;
  }>;
}) {
  const response = await customerApiClient.post<{
    orderId: number;
    orderNumber: string;
    paymentProvider: string;
    providerOrderId: string | null;
    paymentSessionId: string;
    paymentLink: string;
    message: string;
  }>("/customer/me/orders", payload);
  return response.data;
}

export async function createOrderPaymentSessionApi(orderId: number, payload: {
  checkoutSuccessUrl: string;
  checkoutFailureUrl: string;
}) {
  const response = await customerApiClient.post<{
    orderId: number;
    orderNumber: string;
    paymentProvider: string;
    providerOrderId: string | null;
    paymentSessionId: string;
    paymentLink: string;
    message: string;
  }>(`/customer/me/orders/${orderId}/payment-session`, payload);
  return response.data;
}

export async function fetchCustomerOrdersApi() {
  const response = await customerApiClient.get<CustomerOrder[]>("/customer/me/orders");
  return response.data;
}

export async function trackOrderApi(orderNumber: string) {
  const response = await axios.get<Order>(
    `${API_BASE_URL}/orders/track/${encodeURIComponent(orderNumber)}`
  );
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

export function readErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      (typeof error.response?.data?.message === "string" && error.response.data.message) ||
      fallback
    );
  }

  return fallback;
}
