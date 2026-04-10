export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number | null;
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
  productName: string;
  productSlug: string;
  quantity: number;
  unit: string;
  moqSnapshot: string;
  unitPrice: number | null;
  lineTotal: number | null;
};

export type OrderHistory = {
  status: OrderStatus;
  note: string;
  changedAt: string;
};

export type Order = {
  id: number;
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
