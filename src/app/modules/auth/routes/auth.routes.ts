import { Router } from "express";

import { authControllers } from "../controller/auth.controller";

const authRouter: Router = Router();

// Login authentication
authRouter.route("/login").post(authControllers.login);

// Refresh token
// authRouter.route("/refresh-token").post(authControllers.refreshToken);

// Re-send verification OTP
authRouter
  .route("/resend-verification-otp")
  .post(authControllers.resendVerificationOTPToEmail);

// Forget password
authRouter.route("/forget-pwd").post(authControllers.forgotPassword);

// Verify OTP
authRouter.route("/verify-otp").post(authControllers.verifyOTP);

// Verify forget password OTP
authRouter
  .route("/verify-forget-pwd-otp")
  .post(authControllers.forgetPwdVerificationOtp);

authRouter.route("/reset-pwd").patch(authControllers.resetPassword);

// Logout
authRouter.route("/logout").post(authControllers.logout);

export const authRoutes = authRouter;
