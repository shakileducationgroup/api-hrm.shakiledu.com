export type T_ASSETS_UPLOAD_FOLDER_NAME =
  | "users"
  | "taobao"
  | "qc-images"
  | "search"
  | "social-media"
  | "blogs"
  | "advertising"
  | "whatsapp-contact-image";

export const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export enum E_AllowedHeaders {
  Authorization = "Authorization",
  "Content-Type" = "Content-Type",
  "X-Requested-With" = "X-Requested-With",
  X_CLIENT_SOURCE = "X-CLIENT-SOURCE",
}
