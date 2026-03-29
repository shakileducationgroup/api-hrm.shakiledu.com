import { I_GlobalJwtPayload } from "./common.interface";

declare global {
  namespace Express {
    interface Request {
      user: I_GlobalJwtPayload;
    }
  }
}
