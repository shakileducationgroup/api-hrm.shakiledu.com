import { Response } from "express";

interface I_ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
}
const sendResponse = <T>(res: Response, payload: I_ApiResponse<T>) => {
  res.status(payload.statusCode).json({
    success: payload.success,
    statusCode: payload.statusCode,
    message: payload.message,
    data: payload.data ?? null,
  });
};

export default sendResponse;
