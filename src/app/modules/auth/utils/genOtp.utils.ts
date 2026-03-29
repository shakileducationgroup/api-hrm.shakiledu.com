import jwt from "jsonwebtoken";
import env from "../../../config/clean-env";

const generateOTP = (email: string) => {
  // Generate OTP with validation
  let otp: string;

  do {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  } while (otp.length !== 6); // This check is technically redundant but adds safety

  // Create JWT with OTP
  const token = jwt.sign({ email, otp }, env.JWT_OTP_TOKEN, {
    expiresIn: env.EXPIRY as any,
  });

  return {
    token,
    otp, // Validated 6-digit string
  };
};

export default generateOTP;
