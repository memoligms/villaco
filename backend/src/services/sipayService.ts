import crypto from "crypto";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

// Sipay ödeme altyapısı servisi.
// NOT: hash_key üretimi Sipay'in resmi algoritmasıdır (PHP SDK ile aynı). Canlıya
// geçmeden önce Sipay panelindeki "örnek hash" ile doğrulanmalıdır.

const TOKEN_PATH = "/api/token";

export function isSipayConfigured(): boolean {
  const { appId, appSecret, merchantKey } = env.sipay;
  return Boolean(appId && appSecret && merchantKey);
}

function sha1Hex(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}

// Sipay hash_key: total|installment|currency_code|merchant_key|invoice_id verisini
// app_secret'ten türetilen anahtarla AES-256-CBC ile şifreler; "iv:salt:encrypted"
// formatında döner ("/" karakterleri "__" ile değiştirilir).
export function generateHashKey(
  total: string,
  installment: string | number,
  currencyCode: string,
  invoiceId: string
): string {
  const data = `${total}|${installment}|${currencyCode}|${env.sipay.merchantKey}|${invoiceId}`;
  const iv = sha1Hex(String(Math.random())).slice(0, 16);
  const password = sha1Hex(env.sipay.appSecret);
  const salt = sha1Hex(String(Math.random())).slice(0, 4);
  const saltWithPassword = crypto.createHash("sha256").update(password + salt).digest("hex");

  // PHP openssl_encrypt string anahtarı ilk 32 bayta kırpar (aes-256 = 32 bayt).
  const key = Buffer.from(saltWithPassword.slice(0, 32), "utf8");
  const ivBuf = Buffer.from(iv, "utf8");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, ivBuf);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  return `${iv}:${salt}:${encrypted}`.replace(/\//g, "__");
}

export interface SipayHashResult {
  status: string;
  total: string;
  invoiceId: string;
  orderId: string;
  currencyCode: string;
}

// Sipay dönüş (return_url) çağrısındaki hash_key'i çözer ve ödeme sonucunu doğrular.
export function validateHashKey(hashKey: string): SipayHashResult | null {
  if (!hashKey) return null;
  const normalized = hashKey.replace(/__/g, "/");
  const parts = normalized.split(":");
  if (parts.length < 3) return null;

  const [iv, salt, encrypted] = parts;
  const password = sha1Hex(env.sipay.appSecret);
  const saltWithPassword = crypto.createHash("sha256").update(password + salt).digest("hex");
  const key = Buffer.from(saltWithPassword.slice(0, 32), "utf8");
  const ivBuf = Buffer.from(iv, "utf8");

  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, ivBuf);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    const [status, total, invoiceId, orderId, currencyCode] = decrypted.split("|");
    return { status, total, invoiceId, orderId, currencyCode };
  } catch {
    return null;
  }
}

export interface Sipay3DParams {
  cardHolderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  currencyCode: string;
  total: number;
  invoiceId: string;
  invoiceDescription: string;
  name: string;
  surname: string;
  itemName: string;
  returnUrl: string;
  cancelUrl: string;
  ip: string;
}

export interface Sipay3DResult {
  ok: boolean;
  html?: string;
  errorMessage?: string;
  raw?: unknown;
}

// paySmart3D çağrısı: kart + sipariş bilgisiyle 3D Secure formunu (HTML) döndürür.
// Bu HTML tarayıcıya verilip bankanın 3D sayfasına yönlendirme yapılır.
export async function create3DPayment(params: Sipay3DParams): Promise<Sipay3DResult> {
  const token = await getSipayToken();
  const installment = 1;
  const total = params.total.toFixed(2);
  const hashKey = generateHashKey(total, installment, params.currencyCode, params.invoiceId);

  const payload = {
    cc_holder_name: params.cardHolderName,
    cc_no: params.cardNumber.replace(/\s+/g, ""),
    expiry_month: params.expiryMonth,
    expiry_year: params.expiryYear,
    cvv: params.cvv,
    currency_code: params.currencyCode,
    installments_number: installment,
    invoice_id: params.invoiceId,
    invoice_description: params.invoiceDescription,
    name: params.name,
    surname: params.surname,
    total,
    merchant_key: env.sipay.merchantKey,
    items: JSON.stringify([
      { name: params.itemName, price: total, quantity: 1, description: params.invoiceDescription },
    ]),
    cancel_url: params.cancelUrl,
    return_url: params.returnUrl,
    hash_key: hashKey,
    ip: params.ip,
  };

  const res = await fetch(`${env.sipay.baseUrl}/api/paySmart3D`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  // Başarılıysa Sipay HTML (3D form) döndürür; hata durumunda JSON döner.
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<")) {
    return { ok: true, html: text };
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  const message =
    (parsed as { status_description?: string })?.status_description ?? "Ödeme başlatılamadı.";
  return { ok: false, errorMessage: message, raw: parsed };
}

// app_id + app_secret ile bearer token alır.
export async function getSipayToken(): Promise<string> {
  const res = await fetch(`${env.sipay.baseUrl}${TOKEN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ app_id: env.sipay.appId, app_secret: env.sipay.appSecret }),
  });

  const body = (await res.json().catch(() => null)) as
    | { status_code?: number; data?: { token?: string } }
    | null;

  const token = body?.data?.token;
  if (!res.ok || !token) {
    throw new AppError("Sipay token alınamadı.", 502);
  }
  return token;
}
