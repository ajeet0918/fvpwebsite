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

export type QuoteDraft = {
  quoteReference: string;
  adminNotes: string;
  shippingAmount: string;
  taxAmount: string;
  itemPrices: Record<number, string>;
};

export type InquirySubmissionResponse = {
  id: number;
  inquiryType: "GENERAL" | "INVESTOR" | "FARMER" | "COLLECTION_HUB";
  referenceId: string | null;
  status: string;
  verificationStatus: string;
  paymentStatus: string;
};

export type PortalOrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number | null;
  currency: string;
  createdAt: string;
  quoteReference: string | null;
};

export type PortalInvestorSummary = {
  id: number;
  referenceId: string | null;
  status: string;
  verificationStatus: string;
  paymentStatus: string;
  investmentAmount: number | null;
  committedReturnAmount: number | null;
  agreementId: string | null;
  createdAt: string;
};

export type PortalFarmerSummary = {
  id: number;
  referenceId: string | null;
  status: string;
  verificationStatus: string;
  farmingType: string | null;
  landArea: string | null;
  mainCrops: string | null;
  farmerActionNote: string | null;
  createdAt: string;
};

export type PortalSummary = {
  identifier: string;
  totalInvested: number;
  totalCommittedReturn: number;
  orderCount: number;
  orders: PortalOrderSummary[];
  investors: PortalInvestorSummary[];
  farmers: PortalFarmerSummary[];
};
