import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import env from "../../../config/clean-env";
import { I_GlobalJwtPayload } from "../../../interface/common.interface";
import { T_CookieNames, T_ReqSourceType } from "../types/auth.types";

// Generate the password reset token
export const generatePasswordResetToken = (jwtPayload: string) => {
  return jwt.sign({ id: jwtPayload }, env.JWT_PASSWORD_RESET_TOKEN, {
    expiresIn: env.JWT_PASSWORD_RESET_EXPIRES_IN as any,
  });
};

// Generate the token for both access and refresh token
export const createCookie = (
  jwtPayload: I_GlobalJwtPayload,
  cookieType: "Access" | "Refresh",
) => {
  const jwtToken =
    cookieType === "Access" ? env.JWT_ACCESS_TOKEN : env.JWT_REFRESH_TOKEN;

  const jwtTokenExpiry =
    cookieType === "Access"
      ? env.JWT_ACCESS_EXPIRES_IN
      : env.JWT_REFRESH_EXPIRES_IN;

  return jwt.sign(jwtPayload, jwtToken as string, {
    expiresIn: jwtTokenExpiry as any, // 1 day of expiry
  });
};

// Shared configuration
const getCookieConfig = {
  getAccessTokenName: (source: T_ReqSourceType): T_CookieNames =>
    source === "dash" ? "d_ss_id" : "client_session_id",

  getRefreshTokenName: (source: T_ReqSourceType): T_CookieNames =>
    source === "dash" ? "d_r_ss_id" : "client_r_session_id",

  clearOptions: {
    secure: env.isProd,
    sameSite: env.isProd ? "none" : ("strict" as const),
    path: "/",
  },

  accessTokenOptions: (token: string) => ({
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : ("strict" as const),
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: "/",
  }),

  refreshTokenOptions: (token: string) => ({
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : ("strict" as const),
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    path: "/",
  }),
};

// Setting tokens
export const setAccessToken = async (
  res: Response,
  token: string,
  source: T_ReqSourceType = "web",
): Promise<Response> => {
  const cookieName = getCookieConfig.getAccessTokenName(source);

  return res.cookie(
    cookieName,
    token,
    getCookieConfig.accessTokenOptions(token) as any,
  );
};

export const setRefreshToken = async (
  res: Response,
  token: string,
  source: T_ReqSourceType = "web",
): Promise<Response> => {
  const cookieName = getCookieConfig.getRefreshTokenName(source);
  return res.cookie(
    cookieName,
    token,
    getCookieConfig.refreshTokenOptions(token) as any,
  );
};

// Resetting tokens
export const resetAccessToken = (
  req: Request,
  res: Response,
  source: T_ReqSourceType = "web",
): void => {
  const cookieName = getCookieConfig.getAccessTokenName(source);
  if (req.cookies[cookieName]) {
    res.clearCookie(cookieName, getCookieConfig.clearOptions as CookieOptions);
  }
};

export const resetRefreshToken = (
  req: Request,
  res: Response,
  source: T_ReqSourceType = "web",
): void => {
  const cookieName = getCookieConfig.getRefreshTokenName(source);
  if (req.cookies[cookieName]) {
    res.clearCookie(cookieName, getCookieConfig.clearOptions as CookieOptions);
  }
};

// Utility to reset both tokens
export const resetAllTokens = (
  req: Request,
  res: Response,
  source: T_ReqSourceType = "web",
): void => {
  resetAccessToken(req, res, source);
  resetRefreshToken(req, res, source);
};
