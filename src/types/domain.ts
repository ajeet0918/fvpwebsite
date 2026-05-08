export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  priceUnit: string;
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string | null;
  shortDescription: string;
  longDescription: string;
  moq: string;
  featured: boolean;
  category: string;
};

export type OrderStatus =
  | "PENDING_REVIEW"
  | "QUOTED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderPaymentStatus =
  | "NOT_INITIATED"
  | "PENDING"
  | "PAID"
  | "FAILED";

export type OrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  productSlug: string;
  quantity: number;
  unit: string;
  moqSnapshot: string;
  unitPrice: number | null;
  lineSubtotal: number | null;
  taxRate: number | null;
  taxAmount: number | null;
  discountRate: number | null;
  discountAmount: number | null;
  lineTotal: number | null;
};

export type OrderHistory = {
  status: OrderStatus;
  note: string;
  changedAt: string;
};

export type Order = {
  id: number;
  customerId: number | null;
  orderNumber: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  postalCode: string;
  customerNotes: string;
  status: OrderStatus;
  currency: string;
  paymentStatus: OrderPaymentStatus;
  paymentDueAmount: number | null;
  paymentProvider: string | null;
  paymentProviderOrderId: string | null;
  paymentProviderReference: string | null;
  paidAt: string | null;
  createdAt: string;
  quotedAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  adminNotes: string | null;
  quoteReference: string | null;
  subtotalAmount: number | null;
  shippingAmount: number | null;
  taxAmount: number | null;
  discountAmount: number | null;
  effectiveTaxRate: number | null;
  effectiveDiscountRate: number | null;
  totalAmount: number | null;
  items: OrderItem[];
  statusHistory: OrderHistory[];
};

export type CustomerOrder = Order;

export type CustomerProfile = {
  id: number;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  postalCode: string;
  preferredPaymentMethod: string | null;
  preferredPaymentHandle: string | null;
};

export type CustomerAddress = {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type CustomerAuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  role: string;
  profile: CustomerProfile;
};

export type OrderFormItem = {
  productSlug: string;
  quantity: string;
  unit: string;
};

export type OrderFormState = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  postalCode: string;
  customerNotes: string;
  items: OrderFormItem[];
};

export type InquirySubmissionResponse = {
  id: number;
  inquiryType: "GENERAL" | "INVESTOR" | "FARMER" | "COLLECTION_HUB";
  referenceId: string | null;
  status: string;
  verificationStatus: string;
  paymentStatus: string;
};
