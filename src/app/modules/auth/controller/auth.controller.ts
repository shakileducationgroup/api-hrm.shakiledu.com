import { HttpStatusCode } from "axios";
import asyncHandler from "../../../../lib/utils/async-handler";
import sendResponse from "../../../../lib/utils/sendResponse";
import { authServices } from "../service/auth.service";
import { I_LoginBody, T_ReqSourceType } from "../types/auth.types";
import { resetAccessToken, resetRefreshToken } from "../utils/auth.utils";

export const authControllers = {
  // For login
  login: asyncHandler(async (req, res) => {
    const reqSource =
      (req.headers["x-client-source"] as T_ReqSourceType) || "web"; // dash or web
    const { email, password } = req.body as I_LoginBody;

    const { accessToken, refreshToken, user } = await authServices.login({
      email,
      password,
      reqSource,
    });

    // before sending response set the `access` token and `refresh` token into browser cookie
    // setAccessToken(res, accessToken, reqSource);
    // setRefreshToken(res, refreshToken, reqSource);

    sendResponse(res, {
      success: true,
      statusCode: HttpStatusCode.Ok,
      message: "User logged in successful!",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  }),

  // For logout
  logout: asyncHandler(async (req, res) => {
    const reqSource =
      (req.headers["x-client-source"] as T_ReqSourceType) || "web"; // dash or web
    resetAccessToken(req, res, reqSource);
    resetRefreshToken(req, res, reqSource);

    sendResponse(res, {
      success: true,
      statusCode: HttpStatusCode.Ok,
      message: "User logged out successful!",
      data: null,
    });
  }),

  // For re-send the verification email
  resendVerificationOTPToEmail: asyncHandler(async (req, res) => {
    const body = req.body as { email: string; isForgetPwd: boolean };
    const result = await authServices.resendOPTEmail(body);

    sendResponse(res, {
      success: true,
      statusCode: HttpStatusCode.Ok,
      message: `A otp code has been sent to this email:${body.email}`,
      data: result,
    });
  }),

  forgetPwdVerificationOtp: asyncHandler(async (req, res) => {
    const { email, otp } = req.body as { email: string; otp: number };

    const result = await authServices.verifyTheForgetPwdOtp({ email, otp });

    sendResponse(res, {
      success: true,
      statusCode: HttpStatusCode.Ok,
      message: `OTP verified successfully`,
      data: result,
    });
  }),

  // Verify the otp
  verifyOTP: asyncHandler(async (req, res) => {
    const { email, otp } = req.body as {
      email: string;
      otp: number;
    };

    const result = await authServices.verifyTheOTP({ email, otp });

    sendResponse(res, {
      success: true,
      statusCode: HttpStatusCode.Ok,
      message: `OTP verified successfully`,
      data: result,
    });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body as {
      email: string;
    };

    await authServices.sendForgotPasswordOTPEmail(email);

    sendResponse(res, {
      success: true,
      statusCode: HttpStatusCode.Ok,
      message: `OTP has been sent to this email:${email}`,
      data: null,
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body as {
      token: string;
      newPassword: string;
    };

    await authServices.resetPwd({ token, newPassword });

    sendResponse(res, {
      success: true,
      statusCode: HttpStatusCode.Ok,
      message: `Password reset successfully`,
      data: null,
    });
  }),

  // refreshToken: asyncHandler(async (req, res) => {
  //   const refreshToken = req.cookies["refreshToken"] as string;
  // }),

  changePassword: asyncHandler(async (req, res) => {}),
};
