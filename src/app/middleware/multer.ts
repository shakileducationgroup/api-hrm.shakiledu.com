import { Request } from "express";
import fs from "fs";

import multer from "multer";
import path from "path";

import { HttpStatusCode } from "axios";
import { allowedTypes, T_ASSETS_UPLOAD_FOLDER_NAME } from "../constant";
import AppError from "../errors/appError";

export const multerUpload = (folderName: T_ASSETS_UPLOAD_FOLDER_NAME) => {
  const storage = multer.diskStorage({
    destination: function (req: Request, file: any, cb: any) {
      // Determine subfolder based on fieldname

      const uploadPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        folderName,
        file.fieldname, // Dynamic folder name from field
      );
      // Check if folder exists, if not create it
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: function (req: Request, file: any, cb: any) {
      const dateSuffix = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      const baseName = path.parse(file.originalname).name;

      // Sanitize the file name
      const imageName = `${dateSuffix}-${baseName}`
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w\-]+/g, "");

      cb(null, `${imageName}${path.extname(file.originalname)}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB limit per file
    },
    fileFilter: (req, file, cb) => {
      // Validate file types
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new AppError(
            HttpStatusCode.BadRequest,
            "Invalid file type. Only JPEG, PNG, WEBP and JPG are allowed.",
          ),
        );
      }
    },
  });
};
