// src/lib/format.ts
export function formatInr(value: number) {
  return `${value < 0 ? "-" : ""}₹${Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}