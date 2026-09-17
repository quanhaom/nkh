import { provinceAliases } from "../../data/provinceAliases";

function removeVietnameseAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalizeProvinceName(
  value: string
): string {
  let normalized = removeVietnameseAccents(value)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(
      /\b(thanh pho|tinh|province|municipality)\b/g,
      " "
    )
    .replace(/\bcity\b/g, " ")
    .replace(/\btp\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  normalized = provinceAliases[normalized] ?? normalized;

  return normalized;
}