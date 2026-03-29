import path from "path";
import env from "../../app/config/clean-env";

// TODO --> Utility func to send image to cloudinary
const constructUrlAndImageUploaderUtil = async (
  file: Express.Multer.File,
  folderName?: string,
) => {
  // Get current date in YYYYMMDD format
  const dateSuffix = new Date().toISOString().split("T")[0].replace(/-/g, "");

  // Strip extension from original filename
  const baseName = path.parse(file.originalname).name;

  // Construct image name without duplicate extension and sanitize the file name
  const imageName = `${dateSuffix}-${baseName}`
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "");

  // Construct the public URL for accessing the image

  const imageUrl = `${env.isProd ? env.PROD_BACKEND_URL : env.LOCAL_BACKEND_URL}/uploads/${folderName}/${imageName}${path.extname(file.originalname)}`;

  // TODO --> Upload image to Cloudinary and delete the local file
  return imageUrl;
};

export default constructUrlAndImageUploaderUtil;
