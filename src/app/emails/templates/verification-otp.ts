import { currYear } from "../utils/curr-year";

export function verificationOtp(codes: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Your OTP Code - LOGO</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f5f5; font-family: Arial, sans-serif;">
    <!-- Main Wrapper Table -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5">
      <tr>
        <td align="center">
          <!-- Email Container -->
          <table width="550" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; margin-top:20px;">
            
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="#003D7A" style="padding:20px;">
                <span style="color:#ffffff; font-size:32px; font-weight:bold;">LOGO</span>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding:40px 30px; text-align:center;">
                <h2 style="color:#003D7A; font-size:24px; margin:0 0 10px 0;">Verify Your Account</h2>
                <p style="color:#666666; font-size:16px; margin:0 0 30px 0;">Enter the 6-digit code below to complete your verification</p>

                <!-- OTP Table -->
                <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                  <tr>
                    ${codes
                      .split("")
                      .map(
                        (digit) => `
                      <td align="center" valign="middle" 
                          style="border:2px solid #00A8E8; background-color:#ffffff; width:40px; height:50px; font-size:22px; font-weight:bold; color:#003D7A; text-align:center;">
                        ${digit}
                      </td>
                    `
                      )
                      .join("")}
                  </tr>
                </table>

                <!-- Instructions -->
                <p style="color:#666666; font-size:14px; margin:20px 0 0 0; line-height:1.5;">
                  This code will expire in <strong>10 minutes</strong>.<br>
                  If you didn't request this code, please ignore this email.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" bgcolor="#E8F4F8" style="padding:20px; border-top:2px solid #00A8E8;">
                <span style="color:#003D7A; font-size:18px; font-weight:bold; display:block; margin-bottom:10px;">LOGO</span>
                <p style="color:#888888; font-size:12px; margin:0; line-height:1.5;">
                  © ${currYear()} LOGO. All rights reserved.<br>
                  This is an automated message, please do not reply.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function forgetPwdVerificationOtp(codes: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Your OTP Code - LOGO</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f5f5f5; font-family: Arial, sans-serif;">
      <!-- Main Wrapper Table -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5">
        <tr>
          <td align="center">
            <!-- Email Container -->
            <table width="550" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; margin-top:20px;">
              
              <!-- Header -->
              <tr>
                <td align="center" bgcolor="#003D7A" style="padding:20px;">
                  <span style="color:#ffffff; font-size:32px; font-weight:bold;">LOGO</span>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:40px 30px; text-align:center;">
                  <h2 style="color:#2D5A5A; font-size:24px; margin:0 0 10px 0;">You've requested to reset your password</h2>
                  <p style="color:#666666; font-size:16px; margin:0 0 30px 0;">Enter the 6-digit code below to complete your verification</p>
  
                  <!-- OTP Table -->
                  <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                    <tr>
                      ${codes
                        .split("")
                        .map(
                          (digit) => `
                        <td align="center" valign="middle" 
                            style="border:1px solid #C67B5C; background-color:#ffffff; width:40px; height:50px; font-size:22px; font-weight:bold; color:#2D5A5A; text-align:center;">
                          ${digit}
                        </td>
                      `
                        )
                        .join("")}
                    </tr>
                  </table>
  
                  <!-- Instructions -->
                  <p style="color:#666666; font-size:14px; margin:20px 0 0 0; line-height:1.5;">
                    This code will expire in <strong>10 minutes</strong>.<br>
                    If you didn't request this code, please ignore this email.
                  </p>
  
                </td>
              </tr>
  
              <!-- Footer -->
              <tr>
                <td align="center" bgcolor="#F5F1EB" style="padding:20px; border-top:1px solid #e0e0e0;">
                  <span style="color:#C67B5C; font-size:18px; font-weight:bold; display:block; margin-bottom:10px;">LOGO</span>
                  <p style="color:#888888; font-size:12px; margin:0; line-height:1.5;">
                    © ${currYear()} LOGO. All rights reserved.<br>
                    This is an automated message, please do not reply.
                  </p>
                </td>
              </tr>
  
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}
