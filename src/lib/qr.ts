import "server-only";
import QRCode from "qrcode";

const OPTS = {
  errorCorrectionLevel: "M" as const,
  margin: 1,
  color: { dark: "#2a1a14", light: "#ffffff" },
};

export async function qrDataUrl(payload: string, width = 512) {
  return QRCode.toDataURL(payload, { ...OPTS, width });
}

export async function qrPngBuffer(payload: string, width = 512) {
  return QRCode.toBuffer(payload, { ...OPTS, width, type: "png" });
}
