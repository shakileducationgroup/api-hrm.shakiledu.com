import { NextFunction, Request, Response } from "express";
//  Not Found
const notFound = (req: Request, res: Response, next: NextFunction) =>
  res.status(404).json({
    success: false,
    message: `${req.originalUrl} API not found!!`,
    error: "",
  });

export default notFound;
