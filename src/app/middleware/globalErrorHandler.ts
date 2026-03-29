import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  handleForeignKeyConstraintViolation,
  handlePrismaCastError,
  handlePrismaUniqueConstraintError,
  handlePrismaValidationError,
} from "../errors/ORMSchemaError";
import AppError from "../errors/appError";

import sendResponse from "../../lib/utils/sendResponse";
import handleZodError from "../errors/zodError";
import { TErrorSource } from "../interface/erros/error";

const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  __next: NextFunction,
) => {
  // Default values
  let statusCode = 500;
  let message = (error as Error).message || "Something went wrong!";

  // Safely log error without circular references
  try {
    console.log(
      "🚀 ~ globalErrorHandler ~ error:",
      error?.message || JSON.stringify(error, null, 2),
    );
  } catch (logError) {
    console.log(
      "🚀 ~ globalErrorHandler ~ error: [Error object could not be stringified]",
    );
  }

  let errorSources: TErrorSource[] = [
    { path: "", message: "Something went wrong!" },
  ];

  let data: any = null;

  // 🟢 Zod validation error
  if (error instanceof ZodError) {
    const simplified = handleZodError(error);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  }

  // 🟢 Prisma ORM errors

  // Prisma unique constraint violation (P2002)
  else if (error.code === "P2002") {
    // e.g., trying to create a user with an existing unique email
    const prismaError = handlePrismaUniqueConstraintError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errorSources = prismaError.errorSources;
  }

  // Prisma client validation error (schema validation)
  else if (error instanceof Prisma.PrismaClientValidationError) {
    // e.g., invalid data type or missing required field
    const prismaError = handlePrismaValidationError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errorSources = prismaError.errorSources;
  }

  // Prisma cast error (P2023)
  else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2023"
  ) {
    // e.g., invalid ID type for a query (string instead of number)
    const prismaError = handlePrismaCastError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errorSources = prismaError.errorSources;
  }

  // Prisma foreign key constraint violation (P2003)
  else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    // e.g., trying to delete a parent record while children exist
    const prismaError = handleForeignKeyConstraintViolation(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errorSources = prismaError.errorSources;
  }

  // Prisma initialization error
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    // e.g., invalid database URL or cannot connect to DB
    statusCode = 500;
    message = "Invalid database URL or connection string.";
  }

  // 🟢 Custom AppError
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorSources = [{ path: "", message: error.message }];
  }

  // 🟢 Generic JS Error
  else if (error instanceof Error) {
    message = error.message;
    errorSources = [{ path: "", message: error.message }];
  }

  // Unified response
  sendResponse(res, {
    statusCode,
    message,
    success: false,
    data: {
      errorSources,
    },
  });
};

export default globalErrorHandler;
