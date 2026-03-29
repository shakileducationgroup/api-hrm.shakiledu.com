import { UserRole } from "@prisma/client";
import { HttpStatusCode } from "axios";
import { NextFunction, Request, Response } from "express";
import asyncHandler from "../../lib/utils/async-handler";
import { verifyToken } from "../../lib/utils/verify-token.utils";
import env from "../config/clean-env";
import AppError from "../errors/appError";
import { I_GlobalJwtPayload } from "../interface/common.interface";

import { userRepository } from "../modules/user/repository/user.repository";

export const authGuard = (...requiredRole: UserRole[]) =>
  asyncHandler(async (req, res, next) => {
    const { authorization: token } = req.headers;
    // split the token
    const actualToken = token?.split(" ")[1];

    //* if token is available or not
    if (!actualToken) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Token is missing from header!",
      );
    }

    //* Verify token
    const decoded = verifyToken(actualToken, env.JWT_ACCESS_TOKEN as string);

    const { role, email, iat } = decoded as I_GlobalJwtPayload;

    const user = await userRepository.getUniqueUser({
      where: {
        email,
      },
    });

    //* check if user exists in DB by id
    if (!user) {
      throw new AppError(HttpStatusCode.NotFound, "user doesn't exist");
    }

    // if (user.lastPasswordChangedAt) {
    //   throw new AppError(
    //     HttpStatusCode.Unauthorized,
    //     "Password has been changed, please login again"
    //   );
    // }

    // verify role for authorization
    if (requiredRole && !requiredRole.includes(role)) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "You are not authorized by this role!",
      );
    }

    // if decoded undefined
    req.user = decoded as I_GlobalJwtPayload;
    next();
  });

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Return void instead of Response
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Authorization header missing",
      );
    }

    const token = authorization.split(" ")[1];

    // if token is available or not
    if (!token) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Token is missing from header",
      );
    }

    // Verify token
    const decoded = verifyToken(
      token,
      env.JWT_ACCESS_TOKEN,
    ) as I_GlobalJwtPayload;

    if (!decoded || !decoded.id) {
      throw new AppError(HttpStatusCode.Forbidden, "Invalid token");
    }
    const user = await userRepository.getUserByIdFromDB(decoded.id);

    // check if user exists in DB by id
    if (!user) {
      throw new AppError(HttpStatusCode.NotFound, "user doesn't exist");
    }

    // For OAuth users, no password check needed
    if (decoded.iat! < new Date(user.lastPasswordChangedAt!).getTime() / 1000) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Password has been changed, please login again",
      );
    }

    req.user = decoded as I_GlobalJwtPayload;

    next();
  } catch (error) {
    // Don't return the response, just send it
    throw new AppError(HttpStatusCode.Forbidden, (error as Error).message);
  }
};
