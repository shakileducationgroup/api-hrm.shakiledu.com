import env from "../../app/config/clean-env";

export const getPublicImageUrlFromFile = (file: Express.Multer.File) => {
  const baseURl = env.isProd ? env.PROD_CLIENT_URL : env.DEV_CLIENT_URL;

  return baseURl + file.path.split("public")[1].replace(/\\/g, "/");
};
