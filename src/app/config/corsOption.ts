import { CorsOptions } from "cors";
import { E_AllowedHeaders } from "../constant";
import { allowedOrigins } from "./allowedOrigin";

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Reject the request
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allow specific methods
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Idempotency-Key",
    "X-Idempotency-Key", // as some browser wants that format
    E_AllowedHeaders.X_CLIENT_SOURCE,
  ],
  credentials: true, // Allow credentials (cookies, etc.)
  optionsSuccessStatus: 200, // For older browsers compatibility
};

export default corsOptions;
