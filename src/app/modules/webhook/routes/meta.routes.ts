import { Router } from "express";
import { metaWebhookController } from "../controller/metaWebhook.controller";

const metaWebhookRoutes = Router();

metaWebhookRoutes.get("/meta", metaWebhookController.verify);
metaWebhookRoutes.post("/meta", metaWebhookController.handle);

export default metaWebhookRoutes;
