import { Router } from "express";
import { fileUploader } from "../../../../lib/utils/file-uploader";
import { uploadController } from "../controller/upload.controller";
import { polymorphicUploadRoutes } from "./polymorphic-upload.routes";

const router = Router();

router.post(
  "/upload-file",
  fileUploader.uploadSingle,
  uploadController.uploadFile
);

router.use("/", polymorphicUploadRoutes);

export const uploadRoutes = router;
