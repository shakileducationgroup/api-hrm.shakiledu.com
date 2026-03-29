import jwt from "jsonwebtoken";
import env from "../../../config/clean-env";

export const generateEmailVerificationToken = (email: string) => {
  return jwt.sign({ email }, env.JWT_EMAIL_VERIFICATION_TOKEN, {
    expiresIn: "1h",
  });
};
