// src/utils/currencyUtils.js

export function formatCurrency(amount, currencyCode = "NGN") {
  const num = Number(amount || 0);
  
  // Normalize symbols like "$" or "₦" into standard ISO codes if needed
  let normalizedCode = (currencyCode || "NGN").toUpperCase().trim();
  if (normalizedCode === "$") normalizedCode = "USD";
  if (normalizedCode === "₦") normalizedCode = "NGN";
  if (normalizedCode === "€") normalizedCode = "EUR";
  if (normalizedCode === "£") normalizedCode = "GBP";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch (err) {
    // Fallback if an unsupported code is passed
    return `${currencyCode} ${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
}