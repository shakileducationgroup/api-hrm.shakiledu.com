import multer from "multer";

const storage = multer.memoryStorage(); // Store files in memory as Buffer

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

// upload single image
const uploadSingle = upload.single("image");

// upload multiple image
const uploadMultiple = ({
  imageName = "images",
  videoName = "video",
}: {
  imageName?: string;
  videoName?: string;
}) =>
  upload.fields([
    { name: videoName, maxCount: 1 },
    { name: imageName, maxCount: 10 },
  ]);

export const fileUploader = {
  upload,
  uploadSingle,
  uploadMultiple,
};
