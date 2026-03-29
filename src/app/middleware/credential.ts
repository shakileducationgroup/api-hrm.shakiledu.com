import { NextFunction, Request, Response } from "express";
import { allowedOrigins } from "../config/allowedOrigin";

const credentials = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;

  // Check if the origin is allowed and set the proper headers for credentials
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin); // Set the origin dynamically
    res.header("Access-Control-Allow-Credentials", "true"); // Allow credentials (cookies, etc.)
  }

  // Allow specific HTTP methods and headers
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  next();
};

export default credentials;
