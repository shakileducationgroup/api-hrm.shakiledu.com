import { HttpStatusCode } from "axios";
import jwt, {
  JsonWebTokenError,
  JwtPayload,
  TokenExpiredError,
} from "jsonwebtoken";
import AppError from "../../app/errors/appError";

export const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AppError(HttpStatusCode.Unauthorized, "Token has expired!");
    }
    if (error instanceof JsonWebTokenError) {
      throw new AppError(HttpStatusCode.Unauthorized, "Invalid token!");
    }
    throw error; // rethrow other errors
  }
};
