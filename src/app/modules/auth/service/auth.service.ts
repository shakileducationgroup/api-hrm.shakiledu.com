import { HttpStatusCode } from "axios";
import {
  hashPwd,
  validateEncryptedPassword,
} from "../../../../lib/utils/encryption";
import { verifyToken as tokenVerification } from "../../../../lib/utils/verify-token.utils";
import env from "../../../config/clean-env";
import {
  forgetPwdVerificationOtp,
  verificationOtp,
} from "../../../emails/templates/verification-otp";
import AppError from "../../../errors/appError";

import { queueEmail } from "../../../infrastructure/queue/email/email-queue";
import { I_GlobalJwtPayload } from "../../../interface/common.interface";
import { userRepository } from "../../user/repository/user.repository";
import { generateEmailVerificationToken } from "../../user/utils/verification-token";
import { T_ReqSourceType } from "../types/auth.types";
import { createCookie } from "../utils/auth.utils";
import generateOTP from "../utils/genOtp.utils";

class AuthService {
  // User login service
  async login(payload: {
    email: string;
    password: string;
    reqSource: T_ReqSourceType;
  }) {
    const user = await userRepository.getUniqueUser({
      where: {
        email: payload.email,
      },
      select: {
        isBlocked: true,
        isVerified: true,
        id: true,
        email: true,
        password: true,
        role: true,
        loginAttempts: true,
        lastLoginAt: true,
        branchId: true,
        lastPasswordChangedAt: true,
        //@ts-ignore
        profile: {
          select: {
            firstName: true,
            lastName: true,
            fullName: true,
            userImage: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(HttpStatusCode.NotFound, "User doesn't exist");
    }

    if (user.isBlocked) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Your account was blocked by the system! Please contact support!",
      );
    }

    if (!(await validateEncryptedPassword(payload.password, user.password))) {
      throw new AppError(HttpStatusCode.BadRequest, "Invalid credentials!");
    }

    const jwtPayload: I_GlobalJwtPayload = {
      id: user.id,
      role: user.role,
      email: user.email,
      isBlocked: user.isBlocked,
      isVerified: user.isVerified,
      branchId: user.branchId ?? null,
      lastPasswordChangedAt: user.lastPasswordChangedAt,
    };

    // Generate tokens
    const accessToken = createCookie(jwtPayload, "Access");
    const refreshToken = createCookie(jwtPayload, "Refresh");

    // add a queue system for the update the login attempts and last login time - [For future]. Now we'll do it directly

    // update login attempts and last login time
    await userRepository.updateLoginAttempts(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        loginAttempts: user.loginAttempts,
        lastLoginAt: user.lastLoginAt,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        branchId: user.branchId ?? null,
        //@ts-ignore
        profile: user.profile,
      },
    };
  }

  // Send forgot password OTP email
  async sendForgotPasswordOTPEmail(email: string) {
    const isUserExist = await userRepository.getUniqueUser({
      where: {
        email,
      },
    });

    if (!isUserExist) {
      throw new AppError(
        HttpStatusCode.NotFound,
        "User doesn't exist by this email!",
      );
    }

    if (isUserExist.isBlocked) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Your account was blocked by the system! Please contact support!",
      );
    }

    if (!isUserExist.isVerified) {
      throw new AppError(HttpStatusCode.BadRequest, "User not verified!");
    }

    const generateSixDigitOpOTP = generateOTP(email);

    await userRepository.updateUserInfo(isUserExist.id, {
      otp: Number(generateSixDigitOpOTP.otp),
      otpExpires: generateSixDigitOpOTP.token,
    });

    await queueEmail({
      to: email,
      subject: "Your reset password OTP",
      html: forgetPwdVerificationOtp(String(generateSixDigitOpOTP.otp)),
    });

    return null;
  }

  // Re-send verification mail
  async resendOPTEmail({ email, isFPwd }: { email: string; isFPwd?: boolean }) {
    const isUserExist = await userRepository.getUserByMail({ email });

    if (!isUserExist) {
      throw new AppError(
        HttpStatusCode.NotFound,
        "User doesn't exist by this email!",
      );
    }

    if (isUserExist.isBlocked) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Your account was blocked by the system! Please contact support!",
      );
    }
    tokenVerification;

    if (!isFPwd && isUserExist.isVerified) {
      throw new AppError(HttpStatusCode.BadRequest, "User already verified!");
    }

    const generateSixDigitOpOTP = generateOTP(email);

    await userRepository.updateUserInfo(isUserExist.id, {
      otp: Number(generateSixDigitOpOTP.otp),
      otpExpires: generateSixDigitOpOTP.token,
    });

    await queueEmail({
      to: email,
      subject: `Your ${isFPwd ? "reset password" : "verification"} OTP`,
      html: verificationOtp(String(generateSixDigitOpOTP.otp)),
    });

    return null;
  }

  // Verify the OTP
  async verifyTheOTP(payload: { email: string; otp: number }) {
    const user = await userRepository.getUserByMail({ email: payload.email });

    if (!user) {
      throw new AppError(
        HttpStatusCode.NotFound,
        "User doesn't exist by this email!",
      );
    }

    if (user.isBlocked) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Your account was blocked by the system! Please contact support!",
      );
    }

    if (user.isVerified) {
      throw new AppError(HttpStatusCode.BadRequest, "User already verified!");
    }

    if (!user.otpExpires) {
      throw new AppError(
        HttpStatusCode.BadGateway,
        "Invalid request for verifying OTP!",
      );
    }

    const isTokenExpired = tokenVerification(
      user.otpExpires,
      env.JWT_OTP_TOKEN,
    ) as {
      email: string;
      otp: string;
    };

    if (Number(payload.otp) !== Number(isTokenExpired.otp)) {
      throw new AppError(HttpStatusCode.BadRequest, "Invalid OTP!");
    }

    await userRepository.updateUserInfo(user.id, {
      isVerified: true,
      otp: null,
      otpExpires: null,
    });

    return null;
  }

  // Verify the OTP for forget password
  async verifyTheForgetPwdOtp({ email, otp }: { email: string; otp: number }) {
    const user = await userRepository.getUserByMail({ email });

    if (!user) {
      throw new AppError(
        HttpStatusCode.NotFound,
        "User doesn't exist by this email!",
      );
    }

    if (user.isBlocked) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        "Your account was blocked by the system! Please contact support!",
      );
    }

    if (!user.isVerified) {
      throw new AppError(HttpStatusCode.BadRequest, "User is not verified!");
    }

    if (!user.otpExpires) {
      throw new AppError(
        HttpStatusCode.BadRequest,
        "Invalid request for verifying OTP!",
      );
    }

    const isTokenExpired = tokenVerification(
      user.otpExpires,
      env.JWT_OTP_TOKEN,
    ) as {
      email: string;
      otp: string;
    };

    if (Number(otp) !== Number(isTokenExpired.otp)) {
      throw new AppError(HttpStatusCode.BadRequest, "Invalid OTP!");
    }

    if (isTokenExpired.email !== email) {
      throw new AppError(
        HttpStatusCode.BadRequest,
        "Invalid request for verifying OTP!",
      );
    }

    await userRepository.updateUserInfo(user.id, {
      otp: null,
      otpExpires: null,
    });

    return generateEmailVerificationToken(user.email);
  }

  // After verification of forgotten password OTP, user can reset the password
  async resetPwd(payload: { token: string; newPassword: string }) {
    const verifyToken = tokenVerification(
      payload.token,
      env.JWT_EMAIL_VERIFICATION_TOKEN,
    );

    const user = await userRepository.getUserByMail({
      email: verifyToken.email,
    });

    if (!user) {
      throw new AppError(
        HttpStatusCode.NotFound,
        "User doesn't exist by this email!",
      );
    }

    const hashUserPwd = await hashPwd(payload.newPassword);

    await userRepository.updateUserInfo(user.id, {
      password: hashUserPwd,
    });

    return null;
  }
}

export const authServices = new AuthService();
