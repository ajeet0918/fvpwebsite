export type PolicyLink = {
  title: string;
  slug: string;
  summary: string;
  highlights: string[];
};

export const companyLegalDetails = {
  legalName: "FVP PUREPICK SUPPLIERS (OPC) PRIVATE LIMITED",
  address: "Office No. 14122, 14th Floor, Gaur City Mall, Greater Noida West, Gautam Buddha Nagar, Uttar Pradesh - 201318",
  email: "care@fvppurepick.com"
} as const;

export const policyLinks: PolicyLink[] = [
  {
    title: "Terms & Conditions",
    slug: "terms",
    summary: "Governs website use, quotations, orders, payments, invoices, delivery acceptance, account use, liability, disputes, and commercial transactions with FVP Purepick.",
    highlights: [
      "Orders become binding after company confirmation or commencement of procurement, invoicing, or dispatch.",
      "Prices are subject to market, transport, tax, packaging, and availability factors before confirmation.",
      "Agricultural product details, images, packaging, and availability can vary due to season and supply conditions."
    ]
  },
  {
    title: "Privacy Policy",
    slug: "privacy",
    summary: "Explains how customer, business, order, payment, communication, and website information is collected, used, retained, shared, and protected.",
    highlights: [
      "Applies to website visitors, customers, partners, job applicants, and people contacting the company.",
      "Covers information shared through forms, WhatsApp, email, telephone, orders, refunds, and support requests.",
      "Customers can contact the company to request access, correction, deletion, or restriction where applicable."
    ]
  },
  {
    title: "Shipping & Delivery Policy",
    slug: "shipping-delivery",
    summary: "Explains order processing, packing, dispatch, transport, delivery timelines, address responsibility, inspection, failed delivery, and export delivery basics.",
    highlights: [
      "Bulk wholesale order processing is generally 3-10 business days.",
      "Estimated delivery timelines depend on location, order size, availability, transport, and logistics conditions.",
      "Visible transit damage should be reported within 48 hours with supporting details."
    ]
  },
  {
    title: "Return, Refund & Replacement Policy",
    slug: "return-refund",
    summary: "Defines return, refund, replacement, inspection, evidence, risk transfer, perishable-product, bulk-order, and after-sales claim rules.",
    highlights: [
      "Claims must generally be submitted within 48 hours of delivery.",
      "Returns require company verification and written return authorization before goods are sent back.",
      "Approved refunds are generally processed within 7-10 business days after approval."
    ]
  },
  {
    title: "Cancellation Policy",
    slug: "cancellation",
    summary: "Explains when orders can be cancelled and how cancellation is handled for B2B, perishable, bulk, customized, procured, and dispatched orders.",
    highlights: [
      "Cancellation is limited because wholesale agricultural orders can involve immediate procurement, grading, packing, storage, and transport.",
      "Orders generally cannot be cancelled after procurement or dispatch unless the company accepts a valid reason.",
      "Approved cancellation refunds are normally processed within 7-10 business days after deductions where applicable."
    ]
  },
  {
    title: "Cookie Policy",
    slug: "cookie",
    summary: "Explains how cookies and similar technologies may be used for website functionality, security, analytics, preferences, and payment-related services.",
    highlights: [
      "Cookies may support essential website functions, performance, analytics, preferences, and marketing where applicable.",
      "Users can manage, block, restrict, or delete cookies through browser settings.",
      "Disabling certain cookies may affect website functionality."
    ]
  },
  {
    title: "Disclaimer",
    slug: "disclaimer",
    summary: "Sets expectations for product information, images, natural agricultural variation, availability, pricing, website access, third-party links, and liability.",
    highlights: [
      "Product images and information are for general business and product reference.",
      "Agricultural products can naturally vary in size, color, freshness, moisture, grade, and appearance.",
      "Orders become binding only after confirmation by the company."
    ]
  },
  {
    title: "Quality Assurance Policy",
    slug: "quality",
    summary: "Explains quality standards, procurement checks, inspection practices, natural characteristics, packaging, storage, transport, complaints, and corrective action.",
    highlights: [
      "Quality standards are based on commercial practice, agreed specifications, and applicable product requirements.",
      "Natural agricultural variation does not automatically indicate poor quality or defect.",
      "Quality concerns should be reported promptly with order details, photos, videos, and issue description where relevant."
    ]
  },
  {
    title: "Export & International Orders Policy",
    slug: "export",
    summary: "Explains international enquiries, export orders, quotations, MOQ, packaging, documents, payment, currency, shipping, customs, import duties, risk, and disputes.",
    highlights: [
      "Export orders may require minimum quantities and written agreement on payment, delivery terms, packaging, and documentation.",
      "Import duties, taxes, customs fees, port charges, and local clearance costs are generally the buyer's responsibility unless agreed otherwise.",
      "Delivery timelines depend on customs, shipping schedules, logistics, documentation, and conditions outside the company's control."
    ]
  }
];
