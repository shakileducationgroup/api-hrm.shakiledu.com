import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * @function Async Handler Mostly handle the asynchronous problem and catch the errors
 * @Behavior The asyncHandlerFunction is a higher oder function that means it will take a function as parameter and return it from its body
 * @param {function} requestHandler
 * @workFlow take function as an argument (which is basically a request handler function (req, res, next) => {}) and it returns from it's body(asynchandler body) by wrapping it another function which is a function of three parameters (req, res, next) => and it pass through the request handler function.
 * */

const asyncHandler =
  (requestHandler: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error),
    );

export default asyncHandler;
