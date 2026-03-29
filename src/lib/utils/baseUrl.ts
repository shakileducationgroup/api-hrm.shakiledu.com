import env from "../../app/config/clean-env";

export const urlFrontEnd = !env.isProd
  ? env.DEV_CLIENT_URL
  : env.PROD_CLIENT_URL;

export const urlBackEnd = !env.isProd
  ? env.LOCAL_BACKEND_URL
  : env.PROD_BACKEND_URL;
