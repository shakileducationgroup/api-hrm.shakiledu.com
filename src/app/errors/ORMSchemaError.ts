import { Prisma } from "@prisma/client";
import { TErrorSource, TReturnError } from "../interface/erros/error";

export const handlePrismaUniqueConstraintError = (
  error: Prisma.PrismaClientKnownRequestError,
): TReturnError => {
  const statusCode = 409;

  // @ts-ignore
  const target = error?.meta?.target as string[] | string;
  let fieldName = "This field";
  let message = "A duplicate entry already exists.";

  // Handle both array and string formats
  if (Array.isArray(target)) {
    // Composite constraint: [leadId, userId, countryId]
    fieldName = target.join(", ");
    message = `A counselor is already assigned to this lead for the selected country. Please try a different assignment.`;
  } else if (typeof target === "string") {
    // Single field constraint
    const fieldParts = target.split("_");
    fieldName = fieldParts[fieldParts.length - 1] || "This field";
    message = `${fieldName} is already in use. Please try a different one.`;
  }

  const errorSources: TErrorSource[] = [
    {
      path: Array.isArray(target)
        ? target.join(", ")
        : (target as string) || "",
      message: "Unique constraint failed for this combination of fields.",
    },
  ];

  return {
    statusCode,
    message,
    errorSources,
  };
};

export const handlePrismaValidationError = (
  error: Prisma.PrismaClientValidationError,
): TReturnError => {
  const statusCode = 400;

  console.log("🚀 ~ handlePrismaValidationError ~ error:", error);
  // Extract the detailed error message from the error object
  let message = "ORM Validation error";

  // Get the specific validation issue (usually the last line before "at" mentions)
  const detailedMessage =
    error.message
      .split("\n")
      .filter((line) => line.trim() && !line.includes("at "))
      .slice(-1)[0]
      ?.trim() ||
    error.message ||
    `Issues with the provided data. Error type: ${error.name}`;

  message = `${detailedMessage.slice(0, 100)}...` || message;
  const errorSources: TErrorSource[] = [
    {
      path: error.name,
      message: `${detailedMessage.slice(0, 100)}...`,
    },
  ];

  return {
    statusCode,
    message,
    errorSources,
  };
};

export const handlePrismaCastError = (
  error: Prisma.PrismaClientKnownRequestError,
): TReturnError => {
  const statusCode = 400;
  const message = "Invalid data type or format provided.";

  return {
    statusCode,
    message,
    errorSources: [
      {
        path: (error?.meta?.modelName as string) || "",
        message:
          (error.meta?.message as string) || "Invalid input data format.",
      },
    ],
  };
};

export const handleForeignKeyConstraintViolation = (
  error: Prisma.PrismaClientKnownRequestError,
): TReturnError => {
  const statusCode = 400;
  const message = "Foreign key constraint violation.";

  return {
    statusCode,
    message,
    errorSources: [
      {
        path: "",
        message:
          "Cannot delete or update this record because it is referenced by another record.",
      },
    ],
  };
};
