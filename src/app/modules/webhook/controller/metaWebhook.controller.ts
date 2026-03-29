import { HttpStatusCode } from "axios";
import asyncHandler from "../../../../lib/utils/async-handler";
import env from "../../../config/clean-env";
import AppError from "../../../errors/appError";
import { verifyMetaSignature } from "../utils/verify-meta-signature";
import { metaWebhookService } from "../service/metaWebhook.service";

class MetaWebhookController {
  /**
   * GET /api/v1/webhooks/meta
   * Meta webhook verification
   */
  verify = asyncHandler(async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.META_WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    throw new AppError(HttpStatusCode.Forbidden, "Webhook verification failed");
  });

  /**
   * POST /api/v1/webhooks/meta
   * Leadgen events receiver
   */
  handle = asyncHandler(async (req: any, res) => {
    const signature = req.headers["x-hub-signature-256"] as string | undefined;

    const ok = verifyMetaSignature({
      rawBody: req.rawBody,
      signatureHeader: signature,
      appSecret: env.META_APP_SECRET,
    });

    if (!ok) {
      throw new AppError(
        HttpStatusCode.Unauthorized,
        "Invalid webhook signature",
      );
    }

    // Respond fast (Meta expects quick 200)
    res.status(200).json({ received: true });

    // Process asynchronously (in-process). Later you can push to BullMQ.
    const object = req.body?.object;
    if (object === "page") {
      await metaWebhookService.processLeadgenPayload(req.body);
    } else if (object === "whatsapp_business_account") {
      await metaWebhookService.processWhatsAppPayload(req.body);
    }
  });
}

export const metaWebhookController = new MetaWebhookController();
