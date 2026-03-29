import { UserRole } from "@prisma/client";
import formatDateWithDateFns from "../../../lib/utils/format-date";
import { roleExtractor } from "../../../lib/utils/role-extractor";
import { currYear } from "../utils/curr-year";

export const dashUserCreationTemplate = ({
  userEmail,
  secretPassword,
  createdAt,
  userRole,
}: {
  userEmail: string;
  secretPassword: string;
  createdAt: string;
  userRole: string;
}) => {
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Your Account Credentials - Lead Managment - SEG </title>
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
                    <span style="color:#ffffff; font-size:32px; font-weight:bold;">Lead Managment - SEG </span>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding:40px 30px; text-align:center;">
                    <h2 style="color:#003D7A; font-size:24px; margin:0 0 10px 0;">Welcome to Lead Managment - SEG </h2>
                    <p style="color:#666666; font-size:16px; margin:0 0 30px 0;">Your account has been successfully created by our admin. Below are your login credentials to access your account.</p>
    
           <!-- Modern Credentials Table -->
                      <table align="center" cellpadding="10" cellspacing="0" border="0" style="margin:0 auto; width:100%; max-width:550px; background-color:#ffffff; border-radius:8px; table-layout: fixed;">
                        <!-- Table Header -->
                        <thead>
                          <tr>
                            <th style="padding:12px 20px; background-color:#003D7A; color:#ffffff; font-size:18px; font-weight:bold; text-align:left; border-top-left-radius:8px; border-top-right-radius:8px;">Account Information</th>
                          </tr>
                        </thead>
                        <tbody>
  <tr style="border-bottom:1px solid #e0e0e0;">
                            <td style="padding:12px 20px; font-size:16px; color:#003D7A; font-weight:500; text-align:left; background-color:#f9f9f9; white-space:normal; word-wrap:break-word;">
                              <strong>Login Here:</strong> <a href="https://lead.shakiledu.com" target="_blank"> https://lead.shakiledu.com</a>
                            </td>
                          </tr>

                          <!-- Email Row -->
                          <tr style="border-bottom:1px solid #e0e0e0;">
                            <td style="padding:12px 20px; font-size:16px; color:#003D7A; font-weight:500; text-align:left; background-color:#f9f9f9; white-space:normal; word-wrap:break-word;">
                              <strong>Email:</strong> ${userEmail}
                            </td>
                          </tr>
                          
                          <!-- Role Row -->
                          <tr style="border-bottom:1px solid #e0e0e0;">
                        <td style="padding:12px 20px; font-size:16px; color:#003D7A; font-weight:500; text-align:left; background-color:#f9f9f9; white-space:normal; word-wrap:break-word;">
                          <strong>Role:</strong> ${roleExtractor(userRole as UserRole)}
                        </td>
                      </tr>
                          <!-- Temporary Password Row -->
                          <tr style="border-bottom:1px solid #e0e0e0;">
                            <td style="padding:12px 20px; font-size:16px; color:#003D7A; font-weight:500; text-align:left; background-color:#ffffff; white-space:normal; word-wrap:break-word;">
                              <strong>Temporary password:</strong> ${secretPassword}
                            </td>
                          </tr>
                          <!-- Created At Timestamp Row -->
                          <tr>
                            <td style="padding:12px 20px; font-size:16px; color:#003D7A; font-weight:500; text-align:left; background-color:#f9f9f9; white-space:normal; word-wrap:break-word;">
                              <strong>Created at:</strong> ${formatDateWithDateFns(createdAt, "date")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    <!-- Instructions -->
                    <p style="color:#666666; font-size:14px; margin:20px 0 20px 0; line-height:1.5;">
                      Please use the above credentials to log into your account. Once logged in, you will be prompted to change your password to something more secure.
                    </p>
    
                    <p style="color:#666666; font-size:14px; margin:0 0 30px 0; line-height:1.5;">
                      This is a one-time password, and we recommend changing it as soon as possible to ensure the security of your account. If you face any issues logging in, feel free to contact us.
                    </p>
    
                  </td>
                </tr>
    
                <!-- Footer -->
                <tr>
                  <td align="center" bgcolor="#E8F4F8" style="padding:20px; border-top:2px solid #00A8E8;">
                    <span style="color:#003D7A; font-size:18px; font-weight:bold; display:block; margin-bottom:10px;">Lead Managment - SEG</span>
                    <p style="color:#888888; font-size:12px; margin:0; line-height:1.5;">
                      © ${currYear()} Lead Managment - SEG. All rights reserved.<br>
                      This is an automated message, please do not reply.
                    </p>
                  </td>
                </tr>
    
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;
};
