import nodemailer from "nodemailer";
import env from "../../app/config/clean-env";

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  user?: string;
  pass?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
};

export const sendMail = async ({
  to,
  subject,
  html,
  pass,
  user,
  cc,
  bcc,
  replyTo,
}: EmailPayload) => {
  // Create reusable transporter object
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.GOOGLE_APP_PWD,
    },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: !env.isDev,
    },
    logger: env.isDev, // Log more in development
    debug: env.isDev, // Include SMTP traffic in logs
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${env.TRANSPORT_EMAIL}" <${user || env.TRANSPORT_EMAIL}>`,
    to: to,
    subject: subject,
    html: html,
    date: new Date().toUTCString(),
    priority: "high",
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};
