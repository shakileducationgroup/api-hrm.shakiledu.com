import dotenv from "dotenv";
import { cleanEnv, num, str } from "envalid";
import path from "path";
import { AppInstance } from "../interface/common.interface";

// Declaring path for specific .env files
dotenv.config({ path: path.join(process.cwd(), ".env") });

const env = cleanEnv(process.env, {
  // Database uri string
  DEV_CLIENT_URL: str(),
  PROD_CLIENT_URL: str(),
  LOCAL_BACKEND_URL: str(),
  PROD_BACKEND_URL: str(),
  NGROK_BACKEND_URL: str(),

  // App configuration with default users setup
  PORT: num(),
  STAGING_PORT: num(),
  DATABASE_URL: str(),
  ADMIN_EMAIL: str(),
  ADMIN_PASSWORD: str(),
  APP_INSTANCE: str({
    choices: Object.values(AppInstance),
    default: AppInstance.DEVELOPMENT,
  }),

  // WebSocket  settings
  HEARTBEAT_INTERVAL_MS: num(),
  HEARTBEAT_TIMEOUT_MS: num(),
  ENABLE_HEARTBEAT_DEBUG: str(),
  HEARTBEAT_PONG_SAMPLE_N: num(),
  ENABLE_WEBSOCKET_DEBUG: str(),

  // JWT encryptions

  BCRYPT_SALT_ROUNDS: num(),
  JWT_ACCESS_EXPIRES_IN: str(),
  JWT_REFRESH_EXPIRES_IN: str(),
  JWT_PASSWORD_RESET_EXPIRES_IN: str(),
  EXPIRY: str(),
  JWT_ACCESS_TOKEN: str(),
  JWT_REFRESH_TOKEN: str(),
  JWT_PASSWORD_RESET_TOKEN: str(),
  JWT_EMAIL_VERIFICATION_TOKEN: str(),
  JWT_OTP_TOKEN: str(),

  // SMTP setup

  SMTP_HOST: str(),
  SMTP_PORT: num(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  GOOGLE_APP_PWD: str(),
  TRANSPORT_EMAIL: str(),

  DO_SPACE_ACCESS_KEY: str(),
  DO_SPACE_SECRET_KEY: str(),
  DO_SPACE_ENDPOINT: str(),
  DO_SPACE_CDN_ENDPOINT: str(),
  DO_SPACE_BUCKET: str(),
  DO_SPACE_REGION: str(),

  // Redis
  REDIS_URL: str(),
  REDIS_PASSWORD: str(),
  REDIS_PORT: num(),

  // Twilio
  TWILIO_ACCOUNT_SID: str(),
  TWILIO_ACCOUNT_AUTH_TOKEN: str(),
  TWILIO_PHONE_NUMBER: str(),

  // Twilio api keys
  TWILIO_API_SID: str(),
  TWILIO_API_SECRET: str(),

  // Twilio Twiml App SID
  TWILIO_TWIML_APP_SID: str(),

  // Meta Secrets and tokens
  META_APP_SECRET: str(),
  META_WEBHOOK_VERIFY_TOKEN: str(),
  META_PAGE_ACCESS_TOKEN: str(),
});

export default env;
