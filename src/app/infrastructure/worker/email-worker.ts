import { Job, Worker } from "bullmq";
import { sendMail } from "../../../lib/utils/send-mail";
import { redis } from "../../config/redis-connection";

export const createEmailWorker = () => {
  return new Worker(
    "emails",
    async (job: Job) => {
      const { to, subject, html, cc, bcc, replyTo } = job.data;

      try {
        const result = await sendMail({
          to,
          subject,
          html,
          cc,
          bcc,
          replyTo,
        });
        console.log(`Email sent for job ${job.id} to ${to}`);
        return result;
      } catch (error) {
        console.error(`Error sending email for job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 3, // Lower concurrency for email sending
    },
  );
};
const emailWorker = createEmailWorker();

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job: any, err) => {
  console.error(`Email job ${job.id} failed with error: ${err.message}`);
});

emailWorker.on("error", (err) => {
  console.log("🚀 Logging error from email worker:", err);
});
