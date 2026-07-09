import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: required("CORS_ORIGIN", "http://localhost:3000"),
  databaseUrl: required("DATABASE_URL"),
  iyzico: {
    apiKey: required("IYZICO_API_KEY"),
    secretKey: required("IYZICO_SECRET_KEY"),
    baseUrl: required("IYZICO_BASE_URL", "https://sandboxapi.iyzipay.com"),
  },
  // Sipay ödeme altyapısı (opsiyonel — dolu değilse Sipay akışı devre dışı kalır)
  sipay: {
    appId: process.env.SIPAY_APP_ID ?? "",
    appSecret: process.env.SIPAY_APP_SECRET ?? "",
    merchantKey: process.env.SIPAY_MERCHANT_KEY ?? "",
    merchantId: process.env.SIPAY_MERCHANT_ID ?? "",
    baseUrl: process.env.SIPAY_BASE_URL ?? "https://provisioning.sipay.com.tr/ccpayment",
  },
  frontendBaseUrl: required("FRONTEND_BASE_URL", "http://localhost:3000"),
  backendBaseUrl: required("BACKEND_BASE_URL", "http://localhost:4000"),
  admin: {
    username: required("ADMIN_USERNAME", "admin"),
    password: required("ADMIN_PASSWORD", "admin123"),
    jwtSecret: required("JWT_SECRET", "change-this-secret-in-production"),
    tokenTtl: process.env.ADMIN_TOKEN_TTL ?? "12h",
  },
};
