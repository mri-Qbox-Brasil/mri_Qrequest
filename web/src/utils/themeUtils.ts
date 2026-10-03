/**
 * Simple escape function to prevent XSS or breaking text
 */
export function esc(str?: string): string {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Returns a high-contrast text color (black or white) for a given background hex
 */
export function getContrastColor(hexcolor: string): "black" | "white" {
  if (!hexcolor || hexcolor === "transparent") return "white";

  // If it's rgba/rgb, we'll just return white for now as it's complex to parse perfectly
  if (hexcolor.startsWith("rgb")) return "white";

  const hex = hexcolor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

const themeUtils = {
  esc,
  getContrastColor,
};

export default themeUtils;
