import crypto from "crypto";

export function verifyMetaSignature(params: {
  rawBody: Buffer | undefined;
  signatureHeader: string | undefined;
  appSecret: string;
}) {
  const { rawBody, signatureHeader, appSecret } = params;

  if (!rawBody) return false;
  if (!signatureHeader) return false;

  // header format: "sha256=<hash>"
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}
