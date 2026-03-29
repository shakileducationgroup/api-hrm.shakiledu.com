import { NextFunction, Request, Response } from "express";

const parseBodyData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.data) {
    req.body = JSON.parse(req.body.data);
  }
  next();
};
// ? if body data is partial. Often will use for update able routes
export const parseBodyDataInUpdatableRoutes = (
  req: Request,
  __res: Response,
  next: NextFunction,
) => {
  if (!req.body?.data) {
    next();
  } else {
    const parseData = req.body?.data && JSON.parse(req.body.data);
    req.body = parseData;
    next();
  }
};

export default parseBodyData;
