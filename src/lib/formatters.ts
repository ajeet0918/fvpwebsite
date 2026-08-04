export function formatCurrency(value: number | null, currency = "INR") {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatProductPrice(value: number | null, unit?: string) {
  const formattedValue = formatCurrency(value);
  if (!formattedValue) {
    return "Price on request";
  }

  return `${formattedValue} / ${unit || "unit"}`;
}
