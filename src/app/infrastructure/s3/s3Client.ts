import { S3Client } from "@aws-sdk/client-s3";
import env from "../../config/clean-env";

export const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: `${env.DO_SPACE_ENDPOINT}`,
  credentials: {
    accessKeyId: `${env.DO_SPACE_ACCESS_KEY}`,
    secretAccessKey: `${env.DO_SPACE_SECRET_KEY}`,
  },
  forcePathStyle: true,
});
